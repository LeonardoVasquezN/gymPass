import { connection } from "next/server";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import FormularioConfiguracion from "./formulario-configuracion";

export const instant = false;

type PageProps = {
  searchParams: Promise<{
  mensaje?: string;
  }>;
};

const mensajes: Record<string, string> = {
  guardada: "La configuración se guardó correctamente.",
  datos_invalidos: "Revisa el nombre y el teléfono ingresados.",
  imagen_invalida:"Las imágenes deben ser PNG, JPG o WebP y pesar como máximo 1 MB.",
  error: "No se pudo guardar la configuración. Inténtalo nuevamente.",
  sin_permisos: "No tienes permisos para realizar esta acción.",
};

export default async function ConfiguracionPage({
searchParams,
}: PageProps) {
  await connection();
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
      where: {
      id: data.claims.sub,
    },
      select: {
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

  if (!usuario || !usuario.activo || !usuario.gimnasio.activo) {
  redirect("/login");
  }

  if (usuario.rol !== "ADMINISTRADOR") {
  redirect("/admin?mensaje=sin_permisos");
  }

  const { mensaje } = await searchParams;

  return ( 
    <main className="mx-auto w-full max-w-5xl space-y-6"> 
      <header> 
        <h1 className="text-2xl font-bold text-white-900">Configuración del gimnasio </h1>

        <p className="mt-2 text-sm text-white-500">
          Administra los datos de tu gimnasio y los códigos QR de pago.
        </p>
      </header>

      {mensaje && mensajes[mensaje] && (
        <div
          role="status"
          className={`rounded-xl border p-4 text-sm ${
            mensaje === "guardada"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {mensajes[mensaje]}
        </div>
      )}

      <FormularioConfiguracion
        nombre={usuario.gimnasio.nombre}
        telefono={usuario.gimnasio.telefono}
        qrYapeUrl={usuario.gimnasio.qrYapeUrl}
        qrPlinUrl={usuario.gimnasio.qrPlinUrl}
      />
    </main>
  );
}