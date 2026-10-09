"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type MetodoPago =
  | "EFECTIVO"
  | "YAPE"
  | "PLIN"
  | "TRANSFERENCIA"
  | "TARJETA"
  | "OTRO";

function sumarMeses(fecha: Date, meses: number): Date {
  const diaOriginal = fecha.getUTCDate();
  const resultado = new Date(fecha);

  resultado.setUTCDate(1);
  resultado.setUTCMonth(resultado.getUTCMonth() + meses);

  const ultimoDiaMes = new Date(
    Date.UTC(
      resultado.getUTCFullYear(),
      resultado.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  resultado.setUTCDate(Math.min(diaOriginal, ultimoDiaMes));

  return resultado;
}

function fechaDesdeFormulario(valor: FormDataEntryValue | null): Date | null {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return null;
  }

  const fecha = new Date(`${valor}T00:00:00.000Z`);

  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== valor
  ) {
    return null;
  }

  return fecha;
}

export async function crearMembresia(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims || typeof data.claims.sub !== "string") {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: data.claims.sub },
    select: {
      gimnasioId: true,
      activo: true,
      gimnasio: { select: { activo: true } },
    },
  });

  if (!usuario || !usuario.activo || !usuario.gimnasio.activo) {
    redirect("/login");
  }

  const clienteId = String(formData.get("clienteId") ?? "").trim();
  const duracion = Number(formData.get("duracionMeses"));
  const montoTexto = String(formData.get("monto") ?? "").trim();
  const metodoPago = String(formData.get("metodoPago") ?? "") as MetodoPago;
  const observaciones = String(formData.get("observaciones") ?? "").trim();

  const metodosValidos: MetodoPago[] = [
    "EFECTIVO",
    "YAPE",
    "PLIN",
    "TRANSFERENCIA",
    "TARJETA",
    "OTRO",
  ];

  if (!clienteId) {
    redirect("/admin/membresias?mensaje=cliente_invalido");
  }

  if (![1, 2, 3, 6, 12].includes(duracion)) {
    redirect("/admin/membresias?mensaje=duracion_invalida");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(montoTexto)) {
    redirect("/admin/membresias?mensaje=monto_invalido");
  }

  const monto = Number(montoTexto);

  if (!Number.isFinite(monto) || monto <= 0 || monto > 99999999.99) {
    redirect("/admin/membresias?mensaje=monto_invalido");
  }

  if (!metodosValidos.includes(metodoPago)) {
    redirect("/admin/membresias?mensaje=metodo_pago_invalido");
  }

  if (observaciones.length > 1000) {
    redirect("/admin/membresias?mensaje=datos_invalidos");
  }

  const cliente = await prisma.cliente.findFirst({
    where: {
      id: clienteId,
      gimnasioId: usuario.gimnasioId,
      activo: true,
    },
    select: { id: true },
  });

  if (!cliente) {
    redirect("/admin/membresias?mensaje=cliente_invalido");
  }

  const ultimaMembresia = await prisma.membresia.findFirst({
    where: {
      gimnasioId: usuario.gimnasioId,
      clienteId: cliente.id,
    },
    orderBy: [
      { fechaVencimiento: "desc" },
      { creadoEn: "desc" },
    ],
    select: { fechaVencimiento: true },
  });

  const hoyTexto = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const hoy = fechaDesdeFormulario(hoyTexto);

  if (!hoy) {
    redirect("/admin/membresias?mensaje=error");
  }

  let fechaInicio = hoy;

  if (ultimaMembresia) {
    const diaSiguiente = new Date(ultimaMembresia.fechaVencimiento);
    diaSiguiente.setUTCDate(diaSiguiente.getUTCDate() + 1);

    if (diaSiguiente > fechaInicio) {
      fechaInicio = diaSiguiente;
    }
  }

  const fechaVencimiento = sumarMeses(fechaInicio, duracion);

  try {
    await prisma.membresia.create({
      data: {
        gimnasioId: usuario.gimnasioId,
        clienteId: cliente.id,
        fechaInicio,
        fechaVencimiento,
        monto,
        metodoPago,
        observaciones: observaciones || null,
      },
    });
  } catch {
    redirect("/admin/membresias?mensaje=error");
  }

  revalidatePath("/admin/membresias");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin");

  redirect("/admin/membresias?mensaje=creada");
}