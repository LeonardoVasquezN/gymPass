export const instant = false;

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { registrarAsistencia } from "./actions";
import { CheckCircle2, Clock } from "lucide-react";

type SearchParams = Promise<{
  mensaje?: string;
}>;

const mensajes: Record<string, string> = {
  dni_invalido: "Introduce un DNI válido de 8 dígitos.",
  registrada: "Asistencia registrada. Membresía vigente.",
  vencida: "Registro realizado: el cliente no tiene una membresía vigente o está inactivo.",
  dni_no_encontrado: "No se encontró un cliente con ese DNI en este gimnasio.",
};

export default async function AsistenciasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await connection();

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
        select: { activo: true },
      },
    },
  });

  if (!usuario || !usuario.activo || !usuario.gimnasio.activo) {
    redirect("/login");
  }

  const { mensaje } = await searchParams;
  const resultado = mensaje ? mensajes[mensaje] : undefined;

  const asistencias = await prisma.asistencia.findMany({
    where: {
      gimnasioId: usuario.gimnasioId,
    },
    orderBy: {
      fechaHora: "desc",
    },
    take: 20,
    select: {
      id: true,
      dniIngresado: true,
      estado: true,
      fechaHora: true,
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Control de Asistencias
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Registra y consulta los ingresos en tiempo real.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Registrar asistencia</h2>
        </div>

        <form
          action={registrarAsistencia}
          className="mt-5 flex flex-col gap-3 sm:flex-row"
        >
          <input
            name="dni"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{8}"
            maxLength={8}
            minLength={8}
            required
            placeholder="Introduce DNI de 8 dígitos..."
            className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-[#080C14] px-4 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
          />

          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 shadow-md shadow-emerald-500/10"
          >
            Registrar asistencia
          </button>
        </form>

        {resultado && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-slate-800 bg-[#080C14] p-4 text-xs font-medium text-slate-300"
          >
            {resultado}
          </p>
        )}
      </section>

      {/* Lista de Registros */}
      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white mb-4">
          <Clock className="h-4 w-4 text-slate-400" />
          <h2 className="text-lg font-semibold">Últimos registros</h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/20">
          {asistencias.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-500">
              Todavía no hay asistencias registradas hoy.
            </p>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {asistencias.map((asistencia) => (
                <article
                  key={asistencia.id}
                  className="flex flex-col gap-2 p-4 transition hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-200 text-sm">
                      DNI: <span className="font-mono text-white">{asistencia.dniIngresado}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {new Intl.DateTimeFormat("es-PE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "America/Lima",
                      }).format(asistencia.fechaHora)}
                    </p>
                  </div>

                  <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-300">
                    {asistencia.estado.replaceAll("_", " ")}
                  </span>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}