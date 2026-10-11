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

const DURACIONES_MESES = [1, 2, 3, 6, 12];

function fechaDesdeFormulario(valor: string | null): Date | null {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
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

function obtenerHoyLima(): Date | null {
  const texto = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return fechaDesdeFormulario(texto);
}

function calcularVencimiento(
  inicio: Date,
  meses: number
): Date {
  const resultado = new Date(inicio);
  const diaOriginal = resultado.getUTCDate();

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
  resultado.setUTCDate(resultado.getUTCDate() - 1);

  return resultado;
}

export async function crearMembresia(formData: FormData) {
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
      gimnasio: {
        select: { activo: true },
      },
    },
  });

  if (!usuario || !usuario.activo || !usuario.gimnasio.activo) {
    redirect("/login");
  }

  const clienteId = String(formData.get("clienteId") ?? "").trim();
  const tipoDuracion = String(formData.get("tipoDuracion") ?? "");

  const montoTexto = String(formData.get("monto") ?? "").trim();
  const metodoPago = String(
    formData.get("metodoPago") ?? ""
  ) as MetodoPago;

  const observaciones = String(
    formData.get("observaciones") ?? ""
  ).trim();

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

  if (!/^\d+(\.\d{1,2})?$/.test(montoTexto)) {
    redirect("/admin/membresias?mensaje=monto_invalido");
  }

  const monto = Number(montoTexto);

  if (
    !Number.isFinite(monto) ||
    monto <= 0 ||
    monto > 99999999.99
  ) {
    redirect("/admin/membresias?mensaje=monto_invalido");
  }

  if (!metodosValidos.includes(metodoPago)) {
    redirect("/admin/membresias?mensaje=metodo_pago_invalido");
  }

  if (observaciones.length > 1000) {
    redirect("/admin/membresias?mensaje=datos_invalidos");
  }

  if (!["meses", "personalizada"].includes(tipoDuracion)) {
    redirect("/admin/membresias?mensaje=duracion_invalida");
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

  const hoy = obtenerHoyLima();

  if (!hoy) {
    redirect("/admin/membresias?mensaje=error");
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
    select: {
      fechaVencimiento: true,
    },
  });

  let fechaInicio = hoy;

  if (ultimaMembresia) {
    const diaSiguiente = new Date(
      ultimaMembresia.fechaVencimiento
    );

    diaSiguiente.setUTCDate(diaSiguiente.getUTCDate() + 1);

    if (diaSiguiente > fechaInicio) {
      fechaInicio = diaSiguiente;
    }
  }

  let fechaVencimiento: Date | null = null;

  if (tipoDuracion === "meses") {
    const mesesTexto = String(
      formData.get("duracionMeses") ?? ""
    );

    const meses = Number(mesesTexto);

    if (
      !/^\d+$/.test(mesesTexto) ||
      !DURACIONES_MESES.includes(meses)
    ) {
      redirect("/admin/membresias?mensaje=duracion_invalida");
    }

    fechaVencimiento = calcularVencimiento(
      fechaInicio,
      meses
    );
  } else {
    fechaVencimiento = fechaDesdeFormulario(
      String(formData.get("fechaVencimiento") ?? "")
    );

    if (!fechaVencimiento) {
      redirect("/admin/membresias?mensaje=duracion_invalida");
    }
  }

  if (fechaVencimiento < fechaInicio) {
    redirect("/admin/membresias?mensaje=duracion_invalida");
  }

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
  } catch (error) {
    console.error("Error al crear membresía:", error);
    redirect("/admin/membresias?mensaje=error");
  }

  revalidatePath("/admin/membresias");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin");

  redirect("/admin/membresias?mensaje=creada");
}