"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const BUCKET = "gym-qr";
const TAMANO_MAXIMO = 1024 * 1024;

const TIPOS_IMAGEN = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

type TipoQr = "yape" | "plin";

function validarImagen(
  valor: FormDataEntryValue | null
): File | null | undefined {
  if (!(valor instanceof File) || valor.size === 0) {
    return null;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      TIPOS_IMAGEN,
      valor.type
    ) ||
    valor.size > TAMANO_MAXIMO
  ) {
    return undefined;
  }

  return valor;
}

async function subirQr(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gimnasioId: string,
  tipo: TipoQr,
  archivo: File
) {
  const extension =
    TIPOS_IMAGEN[
      archivo.type as keyof typeof TIPOS_IMAGEN
    ];

  const ruta = `${gimnasioId}/${tipo}-${randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, archivo, {
      contentType: archivo.type,
      upsert: false,
    });

  if (error) {
    throw new Error("No se pudo subir la imagen.");
  }

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(ruta);

  return { ruta, url: data.publicUrl };
}

function obtenerRutaQrAnterior(
  url: string | null,
  gimnasioId: string
): string | null {
  if (!url) return null;

  try {
    const pathname = new URL(url).pathname;
    const marcador = `/storage/v1/object/public/${BUCKET}/`;
    const posicion = pathname.indexOf(marcador);

    if (posicion === -1) return null;

    const ruta = decodeURIComponent(
      pathname.slice(posicion + marcador.length)
    );

    if (!ruta.startsWith(`${gimnasioId}/`)) {
      return null;
    }

    return ruta;
  } catch {
    return null;
  }
}

export async function guardarConfiguracion(
  formData: FormData
) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (
    error ||
    !data?.claims ||
    typeof data.claims.sub !== "string"
  ) {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: data.claims.sub },
    select: {
      gimnasioId: true,
      activo: true,
      rol: true,
      gimnasio: {
        select: {
          activo: true,
          nombre: true,
          telefono: true,
          qrYapeUrl: true,
          qrPlinUrl: true,
        },
      },
    },
  });

  if (
    !usuario ||
    !usuario.activo ||
    !usuario.gimnasio.activo
  ) {
    redirect("/login");
  }

  if (usuario.rol !== "ADMINISTRADOR") {
    redirect("/admin?mensaje=sin_permisos");
  }

  const nombre = String(
    formData.get("nombre") ?? ""
  ).trim();

  const telefono = String(
    formData.get("telefono") ?? ""
  ).trim();

  if (
    nombre.length < 2 ||
    nombre.length > 120 ||
    telefono.length > 20
  ) {
    redirect("/admin/configuracion?mensaje=datos_invalidos");
  }

  const archivoYape = validarImagen(
    formData.get("qrYape")
  );

  const archivoPlin = validarImagen(
    formData.get("qrPlin")
  );

  if (archivoYape === undefined || archivoPlin === undefined) {
    redirect("/admin/configuracion?mensaje=imagen_invalida");
  }

  const rutasSubidas: string[] = [];

  let qrYapeUrl = usuario.gimnasio.qrYapeUrl;
  let qrPlinUrl = usuario.gimnasio.qrPlinUrl;

  try {
    if (archivoYape) {
      const resultado = await subirQr(
        supabase,
        usuario.gimnasioId,
        "yape",
        archivoYape
      );

      rutasSubidas.push(resultado.ruta);
      qrYapeUrl = resultado.url;
    }

    if (archivoPlin) {
      const resultado = await subirQr(
        supabase,
        usuario.gimnasioId,
        "plin",
        archivoPlin
      );

      rutasSubidas.push(resultado.ruta);
      qrPlinUrl = resultado.url;
    }
  } catch (error) {
    console.error("Error al subir QR:", error);

    if (rutasSubidas.length > 0) {
      await supabase.storage
        .from(BUCKET)
        .remove(rutasSubidas);
    }

    redirect("/admin/configuracion?mensaje=error");
  }

  try {
    await prisma.gimnasio.update({
      where: { id: usuario.gimnasioId },
      data: {
        nombre,
        telefono: telefono || null,
        qrYapeUrl,
        qrPlinUrl,
      },
    });
  } catch (error) {
    console.error(
      "Error al guardar configuración:",
      error
    );

    if (rutasSubidas.length > 0) {
      await supabase.storage
        .from(BUCKET)
        .remove(rutasSubidas);
    }

    redirect("/admin/configuracion?mensaje=error");
  }

  const rutasAnteriores: string[] = [];

  if (
    archivoYape &&
    usuario.gimnasio.qrYapeUrl
  ) {
    const ruta = obtenerRutaQrAnterior(
      usuario.gimnasio.qrYapeUrl,
      usuario.gimnasioId
    );

    if (ruta) rutasAnteriores.push(ruta);
  }

  if (
    archivoPlin &&
    usuario.gimnasio.qrPlinUrl
  ) {
    const ruta = obtenerRutaQrAnterior(
      usuario.gimnasio.qrPlinUrl,
      usuario.gimnasioId
    );

    if (ruta) rutasAnteriores.push(ruta);
  }

  if (rutasAnteriores.length > 0) {
    const { error: errorEliminacion } =
      await supabase.storage
        .from(BUCKET)
        .remove(rutasAnteriores);

    if (errorEliminacion) {
      console.error(
        "No se pudieron eliminar algunos QR anteriores:",
        errorEliminacion
      );
    }
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin");
  revalidatePath("/checkin/[slug]", "page");

  redirect("/admin/configuracion?mensaje=guardada");
}