export const instant = false;

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = {
    params: Promise<{
        slug: string;
    }>;
};

export default async function CheckinPage({ params }: Props) {
    const { slug } = await params;

    const gimnasio = await prisma.gimnasio.findUnique({
        where: {
            slug,
            activo: true,
        },
        select: {
            nombre: true,
            slug: true,
        },
    });

    if (!gimnasio) {
        notFound();
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10 text-white">
            <section className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl sm:p-8">
                <div className="mb-8 text-center">
                   

                    <h1 className="text-2xl font-bold">
                        {gimnasio.nombre}
                    </h1>

                    <p className="mt-2 text-sm text-gray-400">
                        Consulta tu membresía y registra tu asistencia.
                    </p>
                </div>

                <form className="space-y-4">
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
                            className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20"
                        />
                    </div>

                    <button
                        type="button"
                        disabled
                        className="w-full rounded-xl bg-lime-400 px-4 py-3 font-semibold text-gray-950 opacity-60"
                    >
                        Continuaremos en el siguiente paso
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-gray-500">
                    Acceso de asistencia de {gimnasio.nombre}
                </p>
            </section>
        </main>
    );
}