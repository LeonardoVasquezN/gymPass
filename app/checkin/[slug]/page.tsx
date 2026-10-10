export const instant = false;

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FormularioAsistencia from "./formulario-asistencia";

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

                <FormularioAsistencia slug={gimnasio.slug} />

                <p className="mt-6 text-center text-xs text-gray-500">
                    Acceso de asistencia de {gimnasio.nombre}
                </p>
            </section>
        </main>
    );
}