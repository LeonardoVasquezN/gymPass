export const instant = false;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function obtenerFechaLima() {
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

export default async function AdminPage() {

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
    include: { gimnasio: true },
  });

  if (!usuario || !usuario.activo || !usuario.gimnasio.activo) {
    redirect("/login");
  }

  const gimnasioId = usuario.gimnasioId;

  const hoy = obtenerFechaLima();
  const mananaDate = new Date(`${hoy}T00:00:00.000Z`);
  mananaDate.setUTCDate(mananaDate.getUTCDate() + 1);

  const manana = mananaDate.toISOString().slice(0, 10);

  const fechaHoy = new Date(`${hoy}T00:00:00.000Z`);
  const fechaManana = new Date(`${manana}T00:00:00.000Z`);

  const inicioDia = new Date(`${hoy}T00:00:00-05:00`);
  const inicioManana = new Date(`${manana}T00:00:00-05:00`);

  const clientes = await prisma.cliente.findMany({
    where: {
      gimnasioId,
      activo: true,
    },
    select: {
      membresias: {
        orderBy: { creadoEn: "desc" },
        take: 1,
        select: {
          fechaVencimiento: true,
        },
      },
    },
  });

  let membresiasActivas = 0;
  let membresiasVencidas = 0;

  for (const cliente of clientes) {
    const ultimaMembresia = cliente.membresias[0];

    if (!ultimaMembresia) continue;

    if (ultimaMembresia.fechaVencimiento >= fechaHoy) {
      membresiasActivas++;
    } else {
      membresiasVencidas++;
    }
  }

  const asistenciasHoy = await prisma.asistencia.count({
    where: {
      gimnasioId,
      fechaHora: {
        gte: inicioDia,
        lt: inicioManana,
      },
    },
  });

  const indicadores = [
    {
      titulo: "Clientes registrados",
      valor: clientes.length,
      descripcion: "Clientes activos en el sistema",
    },
    {
      titulo: "Membresías activas",
      valor: membresiasActivas,
      descripcion: "Última membresía vigente",
    },
    {
      titulo: "Membresías vencidas",
      valor: membresiasVencidas,
      descripcion: "Requieren renovación",
    },
    {
      titulo: "Asistencias de hoy",
      valor: asistenciasHoy,
      descripcion: "Entradas registradas hoy",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-medium text-emerald-400">
            PANEL DE ADMINISTRACIÓN
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {usuario.gimnasio.nombre}
          </h1>

          <p className="mt-2 text-slate-400">
            Bienvenido, {usuario.correo}
          </p>
        </header>

        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Resumen del gimnasio
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {indicadores.map((indicador) => (
              <article
                key={indicador.titulo}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <p className="text-sm text-slate-400">
                  {indicador.titulo}
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {indicador.valor}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {indicador.descripcion}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}