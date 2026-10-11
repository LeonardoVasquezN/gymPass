export const instant = false;

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CreditCard, Search } from "lucide-react";
import FormularioMembresia from "./formulario-membresia";

type SearchParams = Promise<{
  mensaje?: string;
  q?: string;
}>;

const mensajes: Record<string, string> = {
  creada: "Membresía registrada correctamente.",
  cliente_invalido: "Selecciona un cliente activo válido.",
  duracion_invalida: "La duración seleccionada no es válida.",
  monto_invalido: "Introduce un monto válido mayor que cero.",
  metodo_pago_invalido: "Selecciona un método de pago válido.",
  datos_invalidos: "Revisa los datos ingresados.",
  error: "No se pudo registrar la membresía. Inténtalo nuevamente.",
};

function fechaLima(fecha: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(fecha);
}

function obtenerHoyLima() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)!.value;

  return `${obtener("year")}-${obtener("month")}-${obtener("day")}`;
}

export default async function MembresiasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await connection();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const mensaje = params.mensaje ? mensajes[params.mensaje] : undefined;

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
      gimnasio: {
        select: {
          nombre: true,
          activo: true,
        },
      },
    },
  });

  if (!usuario || !usuario.activo || !usuario.gimnasio.activo) {
    redirect("/login");
  }

  const gimnasioId = usuario.gimnasioId;

  const condicionBusquedaCliente = q
    ? {
        OR: [
          { dni: { contains: q } },
          { nombres: { contains: q, mode: "insensitive" as const } },
          { apellidos: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [clientes, membresias] = await Promise.all([
    prisma.cliente.findMany({
      where: {
        gimnasioId,
        activo: true,
        ...condicionBusquedaCliente,
      },
     select: {
      id: true,
      dni: true,
      nombres: true,
      apellidos: true,
      membresias: {
        orderBy: [
          { fechaVencimiento: "desc" },
          { creadoEn: "desc" },
        ],
        take: 1,
        select: {
          fechaVencimiento: true,
        },
      },
    },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
      take: 100,
    }),

    prisma.membresia.findMany({
      where: {
        gimnasioId,
        ...(q
          ? {
              cliente: condicionBusquedaCliente,
            }
          : {}),
      },
      select: {
        id: true,
        clienteId: true,
        fechaInicio: true,
        fechaVencimiento: true,
        monto: true,
        metodoPago: true,
        creadoEn: true,
        cliente: {
          select: {
            dni: true,
            nombres: true,
            apellidos: true,
          },
        },
      },
      orderBy: { creadoEn: "desc" },
      take: 100,
    }),
  ]);

  const hoy = obtenerHoyLima();

  const clientesFormulario = clientes.map((cliente) => ({
    id: cliente.id,
    nombres: cliente.nombres,
    apellidos: cliente.apellidos,
    dni: cliente.dni,
    ultimaFechaVencimiento:
      cliente.membresias[0]?.fechaVencimiento
        .toISOString()
        .slice(0, 10) ?? null,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Membresías
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {usuario.gimnasio.nombre} · Registra pagos y controla vencimientos.
        </p>
      </div>

      {mensaje && (
        <div
          role="status"
          className={`rounded-xl border p-4 text-sm font-medium ${
            params.mensaje === "creada"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          {mensaje}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Registrar membresía</h2>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Selecciona un cliente, define la duración y registra su pago.
        </p>

        <FormularioMembresia
          clientes={clientesFormulario}
          hoy={hoy}
        />
      </section>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Historial de membresías</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Últimos 100 registros de este gimnasio.
            </p>
          </div>

          <form method="GET" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar DNI o nombre..."
                className="w-full rounded-xl border border-slate-800 bg-[#080C14] pl-10 pr-4 py-2 text-sm text-slate-200 outline-none transition focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl border border-slate-800 bg-slate-800/50 px-4 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800/60">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#080C14] text-xs uppercase text-slate-400 border-b border-slate-800/80">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Inicio</th>
                <th className="px-4 py-3 font-medium">Vencimiento</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/20">
              {membresias.map((membresia) => {
                const vencida =
                  membresia.fechaVencimiento.toISOString().slice(0, 10) < hoy;

                return (
                  <tr key={membresia.id} className="transition hover:bg-slate-800/30">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-200">
                        {membresia.cliente.nombres} {membresia.cliente.apellidos}
                      </p>
                      <p className="text-xs text-slate-500">
                        DNI {membresia.cliente.dni}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">{fechaLima(membresia.fechaInicio)}</td>
                    <td className="px-4 py-3.5 text-slate-400">{fechaLima(membresia.fechaVencimiento)}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-200">S/ {Number(membresia.monto).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-slate-400">{membresia.metodoPago}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        vencida
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {vencida ? "Vencida" : "Vigente"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {membresias.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-500">
            Todavía no hay membresías registradas.
          </p>
        )}
      </section>
    </div>
  );
}