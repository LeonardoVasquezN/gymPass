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
  
  async function iniciarSesionGoogle() {
    setError("");
    setCargando(true);

    try {
      const supabase = createClient();

      const { error: errorGoogle } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

      if (errorGoogle) {
        setError("No se pudo iniciar sesión con Google.");
        setCargando(false);
      }
    } catch {
      setError("No se pudo iniciar sesión con Google.");
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
        
        <div className="mt-5">
          <div className="relative mb-5 flex items-center">
            <div className="flex-1 border-t border-slate-800" />
            <span className="px-3 text-xs text-slate-500">
              O continúa con
            </span>
            <div className="flex-1 border-t border-slate-800" />
          </div>

          <button
            type="button"
            onClick={iniciarSesionGoogle}
            disabled={cargando}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              viewBox="0 0 48 48"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.02 13.22l7.98 6.19C11.89 13.72 17.55 9.5 24 9.5Z"
                transform="translate(0 4)"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.02 46.98 31.95 46.98 24.55Z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
                transform="translate(0 4)"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.45 0-12.11-4.22-14.1-10.09l-7.98 6.19C6.41 42.62 14.62 48 24 48Z"
                transform="translate(0 -4)"
              />
            </svg>

            Continuar con Google
          </button>
        </div>
      </section>
    </main>
  );
}