"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CheckCircle2,
  LogOut,
  Dumbbell,
  Menu,
  X,
  ChevronRight,
  Settings,
  ShieldCheck,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
  esSuperadministrador: boolean;
};

function obtenerNavegacion(esSuperadministrador: boolean) {
  return [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Clientes", href: "/admin/clientes", icon: Users },
    { name: "Membresías", href: "/admin/membresias", icon: CreditCard },
    { name: "Asistencias", href: "/admin/asistencias", icon: CheckCircle2 },
    { name: "Configuración", href: "/admin/configuracion", icon: Settings },
    ...(esSuperadministrador
      ? [
          {
            name: "Superadministración",
            href: "/superadmin",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];
}

export default function AdminLayoutClient({
  children,
  esSuperadministrador,
}: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = obtenerNavegacion(esSuperadministrador);
  const currentNav = navigation.find((item) =>
    pathname === item.href ||
    (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))
  );


  return (
    <div className="flex min-h-screen bg-[#080C14] font-sans text-slate-100 antialiased">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-slate-800/60 bg-[#0B0F19] p-4 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="mb-6 flex items-center justify-between border-b border-slate-800/60 px-2 pb-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-500/10">
                <Dumbbell className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-bold tracking-tight text-white">
                  GymPass
                </h2>
                <p className="text-xs font-medium text-slate-400">
                  Panel de Gestión
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar menú"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1.5">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Menú Principal
            </p>

            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" &&
                  pathname.startsWith(`${item.href}/`));

              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive ? "text-emerald-400" : "text-slate-400"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-800/60 pt-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-800/40 bg-slate-900/60 px-3 py-2.5">
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200">
                Administración
              </p>
              <p className="truncate text-[11px] text-slate-400">
                Sesión activa
              </p>
            </div>

            <Link
              href="/login"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 w-full flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800/60 bg-[#080C14]/90 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="hidden sm:inline">Admin</span>
              <ChevronRight className="hidden h-3 w-3 text-slate-600 sm:inline" />
              <span className="text-sm font-semibold text-slate-100 sm:text-xs">
                {currentNav?.name || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="hidden sm:inline">Sistema en línea</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}