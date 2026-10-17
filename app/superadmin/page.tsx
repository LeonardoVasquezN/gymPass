export const instant = false;

import { connection } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarSuperadministrador } from "@/lib/auth/superadmin";

export default async function SuperadminPage() {
  await connection();

  const { autorizado } = await verificarSuperadministrador();

  if (!autorizado) {
    redirect("/admin");
  }

  const gimnasios = await prisma.gimnasio.findMany({
    orderBy: {
      creadoEn: "desc",
    },
    select: {
      id: true,
      nombre: true,
      slug: true,
      activo: true,
      suscripcionHasta: true,
      creadoEn: true,
      _count: {
        select: {
          usuarios: true,
        },
      },
    },
  });

  const formatoFecha = (fecha: Date | null) => {
    if (!fecha) return "Sin suscripción registrada";

    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeZone: "America/Lima",
    }).format(fecha);
  };

  return (
    <main className="min-h-screen space-y-8 bg-slate-950 p-6 text-white md:p-10">
      <header>
        <p className="text-sm font-medium text-emerald-400">
          GYMPASS · SUPERADMINISTRACIÓN
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Panel de la plataforma
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Gestiona los gimnasios registrados y consulta sus suscripciones.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Gimnasios registrados
          </p>

          <p className="mt-3 text-3xl font-bold">
            {gimnasios.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Gimnasios habilitados
          </p>

          <p className="mt-3 text-3xl font-bold">
            {gimnasios.filter((g) => g.activo).length}
          </p>
        </article>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">
          Gimnasios clientes
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Gimnasio</th>
                <th className="px-4 py-3 font-medium">Usuarios</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">
                  Suscripción hasta
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {gimnasios.map((gimnasio) => (
                <tr key={gimnasio.id}>
                  <td className="px-4 py-4">
                    <p className="font-medium">
                      {gimnasio.nombre}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {gimnasio.slug}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    {gimnasio._count.usuarios}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={
                        gimnasio.activo
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {gimnasio.activo ? "Habilitado" : "Deshabilitado"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {formatoFecha(gimnasio.suscripcionHasta)}
                  </td>
                </tr>
              ))}

              {gimnasios.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Todavía no hay gimnasios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}