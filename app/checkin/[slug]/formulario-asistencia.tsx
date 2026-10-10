"use client";

import { useActionState } from "react";
import {consultarAsistencia,type EstadoConsulta,} from "./actions";

type Props = {
    slug: string;
};

const estadoInicial: EstadoConsulta = {
    tipo: "inicial",
    mensaje: "",
};

export default function FormularioAsistencia({ slug }: Props) {
    const [estado, action, pendiente] = useActionState(consultarAsistencia,estadoInicial);

    const colorMensaje = {
        inicial: "",
        no_matriculado: "border-red-500/30 bg-red-500/10 text-red-300",
        registrada: "border-lime-500/30 bg-lime-500/10 text-lime-300",
        vencida: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        error: "border-red-500/30 bg-red-500/10 text-red-300",
    }[estado.tipo];

    return (
        <form action={action} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />

            <div>
                <label
                    htmlFor="dni"
                    className="mb-2 block text-sm font-medium text-gray-200"
                >
                    Número de DNI
                </label>

                <input
                    id="dni"
                    name="dni"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{8}"
                    maxLength={8}
                    minLength={8}
                    placeholder="Ingresa tu DNI"
                    required
                    disabled={pendiente}
                    autoComplete="off"
                    className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 disabled:opacity-60"
                />
            </div>

            <button
                type="submit"
                disabled={pendiente}
                className="w-full rounded-xl bg-lime-400 px-4 py-3 font-semibold text-gray-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {pendiente ? "Consultando..." : "Consultar asistencia"}
            </button>
            
            {estado.tipo !== "inicial" && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`rounded-xl border p-4 text-sm font-medium ${colorMensaje}`}
                >
                    <p>{estado.mensaje}</p>

                    {estado.fechaVencimiento && (
                        <p className="mt-3">
                            Fecha de vencimiento:{" "}
                            <strong>
                                {new Intl.DateTimeFormat("es-PE", {
                                    dateStyle: "long",
                                    timeZone: "UTC",
                                }).format(
                                    new Date(`${estado.fechaVencimiento}T00:00:00Z`)
                                )}
                            </strong>
                        </p>
                    )}

                    {estado.tipo === "registrada" &&
                        estado.diasRestantes !== undefined && (
                            <p className="mt-2">
                                {estado.diasRestantes === 0
                                    ? "Tu membresía vence hoy."
                                    : estado.diasRestantes === 1
                                      ? "Te queda 1 día de membresía."
                                      : `Te quedan ${estado.diasRestantes} días de membresía.`}
                            </p>
                      )}
                </div>
            )}
        </form>
    );
}