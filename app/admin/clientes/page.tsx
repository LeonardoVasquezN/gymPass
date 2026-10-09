export const instant = false;

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { crearCliente } from "./actions";
import { Users, Search, UserPlus } from "lucide-react";

type SearchParams = Promise<{
  q?: string;
  estado?: string;
  mensaje?: string;
}>;

const mensajes: Record<string, string> = {
  creado: "Cliente registrado correctamente.",
  dni_invalido: "El DNI debe contener exactamente 8 dígitos.",
  campos_obligatorios: "Los nombres y apellidos son obligatorios.",
  dni_duplicado: "Ya existe un cliente con ese DNI en tu gimnasio.",
  datos_invalidos: "Revisa la longitud del teléfono y las observaciones.",
  error: "No se pudo registrar el cliente. Inténtalo nuevamente.",
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  const usuarioId = data.claims.sub;
  if (typeof usuarioId !== "string") redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
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

  const params = await searchParams;
  const busqueda = (params.q ?? "").trim();
  const estado = params.estado === "inactivos" ? "inactivos" : "activos";

  const where = {
    gimnasioId: usuario.gimnasioId,
    activo: estado === "activos",
    ...(busqueda
      ? {
          OR: [
            { dni: { contains: busqueda } },
            { nombres: { contains: busqueda, mode: "insensitive" as const } },
            { apellidos: { contains: busqueda, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [clientes, totalClientesEstado, totalActivosHeader] = await Promise.all([
    prisma.cliente.findMany({
      where,
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
      take: 100,
      select: {
        id: true,
        dni: true,
        nombres: true,
        apellidos: true,
        telefono: true,
        activo: true,
        creadoEn: true,
      },
    }),
    prisma.cliente.count({
      where: { gimnasioId: usuario.gimnasioId, activo: estado === "activos" },
    }),
    prisma.cliente.count({
      where: { gimnasioId: usuario.gimnasioId, activo: true },
    }),
  ]);

  const mensaje = params.mensaje ? mensajes[params.mensaje] : undefined;
  const esError = params.mensaje !== undefined && params.mensaje !== "creado";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Gestión de Clientes
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {usuario.gimnasio.nombre} · Administra los miembros de tu gimnasio.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3 backdrop-blur-sm">
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Clientes activos</p>
            <p className="text-xl font-bold text-white">{totalActivosHeader}</p>
          </div>
        </div>
      </header>

      {mensaje && (
        <div
          role="status"
          className={`rounded-xl border p-4 text-sm font-medium ${
            esError
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {mensaje}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white">
          <UserPlus className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Registrar cliente</h2>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Completa los datos para agregar un nuevo cliente a la base de datos.
        </p>

        <form action={crearCliente} className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="dni" className="mb-1.5 block text-xs font-medium text-slate-300">
              DNI *
            </label>
            <input
              id="dni"
              name="dni"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{8}"
              maxLength={8}
              minLength={8}
              required
              placeholder="12345678"
              className="w-full rounded-xl border border-slate-800 bg-[#080C14] px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="telefono" className="mb-1.5 block text-xs font-medium text-slate-300">
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              maxLength={30}
              placeholder="999 999 999"
              className="w-full rounded-xl border border-slate-800 bg-[#080C14] px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="nombres" className="mb-1.5 block text-xs font-medium text-slate-300">
              Nombres *
            </label>
            <input
              id="nombres"
              name="nombres"
              type="text"
              required
              maxLength={100}
              placeholder="Nombres del cliente"
              className="w-full rounded-xl border border-slate-800 bg-[#080C14] px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="apellidos" className="mb-1.5 block text-xs font-medium text-slate-300">
              Apellidos *
            </label>
            <input
              id="apellidos"
              name="apellidos"
              type="text"
              required
              maxLength={100}
              placeholder="Apellidos del cliente"
              className="w-full rounded-xl border border-slate-800 bg-[#080C14] px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="observaciones" className="mb-1.5 block text-xs font-medium text-slate-300">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              rows={3}
              maxLength={1000}
              placeholder="Información adicional (opcional)"
              className="w-full rounded-xl border border-slate-800 bg-[#080C14] p-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 shadow-md shadow-emerald-500/10"
            >
              Registrar cliente
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Directorio de clientes</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalClientesEstado} clientes {estado} · Se muestran hasta 100 resultados.
            </p>
          </div>

          <div className="flex gap-1.5 rounded-xl border border-slate-800 bg-[#080C14] p-1">
            <a
              href="/admin/clientes?estado=activos"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                estado === "activos"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Activos
            </a>
            <a
              href="/admin/clientes?estado=inactivos"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                estado === "inactivos"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Inactivos
            </a>
          </div>
        </div>

        <form method="GET" action="/admin/clientes" className="mt-5 flex gap-3">
          <input type="hidden" name="estado" value={estado} />
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="search"
              name="q"
              defaultValue={busqueda}
              placeholder="Buscar por DNI, nombres o apellidos..."
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

        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800/60">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-[#080C14] text-xs uppercase text-slate-400 border-b border-slate-800/80">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/20">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="transition hover:bg-slate-800/30">
                  <td className="px-4 py-3.5 font-medium text-slate-200">
                    {cliente.nombres} {cliente.apellidos}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400">{cliente.dni}</td>
                  <td className="px-4 py-3.5 text-slate-400">
                    {cliente.telefono || "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        cliente.activo
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {cliente.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}

              {clientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No se encontraron clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}