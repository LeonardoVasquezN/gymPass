"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dumbbell, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function iniciarSesion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCargando(true);

    try {
      const supabase = createClient();

      const { error: errorLogin } =
        await supabase.auth.signInWithPassword({
          email: correo.trim(),
          password: contrasena,
        });

      if (errorLogin) {
        setError("Correo o contraseña incorrectos.");
        return;
      }

      window.location.assign("/admin");
    } catch {
      setError("No se pudo iniciar sesión. Inténtalo nuevamente.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080C14] px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">GymPass</h1>
          <p className="mt-1 text-xs text-slate-400">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>

        <form onSubmit={iniciarSesion} className="space-y-4">
          <div>
            <label
              htmlFor="correo"
              className="mb-1.5 block text-xs font-medium text-slate-300"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                id="correo"
                type="email"
                autoComplete="email"
                required
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                placeholder="admin@tugimnasio.com"
                className="w-full rounded-xl border border-slate-800 bg-[#080C14] pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none transition focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="contrasena"
              className="mb-1.5 block text-xs font-medium text-slate-300"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                id="contrasena"
                type="password"
                autoComplete="current-password"
                required
                value={contrasena}
                onChange={(event) => setContrasena(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-[#080C14] pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none transition focus:border-emerald-500"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 shadow-md shadow-emerald-500/10"
          >
            {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}