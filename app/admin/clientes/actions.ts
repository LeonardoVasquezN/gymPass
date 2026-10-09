"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function crearCliente(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const usuarioId = data.claims.sub;

  if (typeof usuarioId !== "string") {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      gimnasioId: true,
      activo: true,
      gimnasio: {
        select: { activo: true },
      },
    },
  });

  if (!usuario || !usuario.activo || !usuario.gimnasio.activo) {
    redirect("/login");
  }

  const dni = String(formData.get("dni") ?? "").trim();
  const nombres = String(formData.get("nombres") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const observaciones = String(formData.get("observaciones") ?? "").trim();

  if (!/^\d{8}$/.test(dni)) {
    redirect("/admin/clientes?mensaje=dni_invalido");
  }

  if (!nombres || !apellidos) {
    redirect("/admin/clientes?mensaje=campos_obligatorios");
  }

  if (telefono.length > 30 || observaciones.length > 1000) {
    redirect("/admin/clientes?mensaje=datos_invalidos");
  }

  try {
    await prisma.cliente.create({
      data: {
        gimnasioId: usuario.gimnasioId,
        dni,
        nombres,
        apellidos,
        telefono: telefono || null,
        observaciones: observaciones || null,
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      redirect("/admin/clientes?mensaje=dni_duplicado");
    }

    redirect("/admin/clientes?mensaje=error");
  }

  revalidatePath("/admin/clientes");
  revalidatePath("/admin");

  redirect("/admin/clientes?mensaje=creado");
}