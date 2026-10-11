export const instant = false;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import { Users, CreditCard, AlertCircle, UserCheck } from "lucide-react";
import QrAcceso from "./qr-acceso";

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
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub || typeof data.claims.sub !== "string") {
    redirect("/login");
  }

  const usuarioId = data.claims.sub;

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      correo: true,
      activo: true,
      gimnasioId: true,
      gimnasio: {
          select: {
              nombre: true,
              slug: true,
              activo: true,
          },
      },
    },
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

  const inicioDia = new Date(`${hoy}T00:00:00-05:00`);
  const inicioManana = new Date(`${manana}T00:00:00-05:00`);

  const [clientes, asistenciasHoy] = await Promise.all([
    prisma.cliente.findMany({
      where: {
        gimnasioId,
        activo: true,
      },
      select: {
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
    }),
    prisma.asistencia.count({
      where: {
        gimnasioId,
        fechaHora: {
          gte: inicioDia,
          lt: inicioManana,
        },
      },
    }),
  ]);

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

  const indicadores = [
    {
      titulo: "Clientes registrados",
      valor: clientes.length,
      descripcion: "Clientes activos en el sistema",
      icon: Users,
    },
    {
      titulo: "Membresías activas",
      valor: membresiasActivas,
      descripcion: "Última membresía vigente",
      icon: CreditCard,
    },
    {
      titulo: "Membresías vencidas",
      valor: membresiasVencidas,
      descripcion: "Requieren renovación",
      icon: AlertCircle,
    },
    {
      titulo: "Asistencias de hoy",
      valor: asistenciasHoy,
      descripcion: "Entradas registradas hoy",
      icon: UserCheck,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          {usuario.gimnasio.nombre}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Bienvenido, <span className="text-slate-200">{usuario.correo}</span>
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Resumen General
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {indicadores.map((indicador) => {
            const Icon = indicador.icon;
            return (
              <article
                key={indicador.titulo}
                className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium text-slate-400">
                    {indicador.titulo}
                  </span>
                  <div className="rounded-lg bg-slate-800/60 p-2 text-emerald-400 border border-slate-700/50">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold tracking-tight text-white">
                  {indicador.valor}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {indicador.descripcion}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <QrAcceso
            slug={usuario.gimnasio.slug}
            nombreGimnasio={usuario.gimnasio.nombre}
        />
    </div>
  );
}