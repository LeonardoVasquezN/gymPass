"use server";

import { prisma } from "@/lib/prisma";

export type EstadoConsulta = {
    tipo:
        | "inicial"
        | "no_matriculado"
        | "registrada"
        | "vencida"
        | "error";
    mensaje: string;
    fechaVencimiento?: string;
    diasRestantes?: number;
};

export async function consultarAsistencia(
    _estadoAnterior: EstadoConsulta,
    formData: FormData
): Promise<EstadoConsulta> {
    const dni = String(formData.get("dni") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();

    if (!/^\d{8}$/.test(dni)) {
        return {
            tipo: "error",
            mensaje: "Ingresa un DNI válido de 8 dígitos.",
        };
    }

    try {
        const gimnasio = await prisma.gimnasio.findUnique({
            where: { slug, activo: true },
            select: { id: true },
        });

        if (!gimnasio) {
            return {
                tipo: "error",
                mensaje: "No se pudo identificar el gimnasio.",
            };
        }

        const fechaLima = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Lima",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date());

        const fechaActual = new Date(`${fechaLima}T00:00:00.000Z`);

        const cliente = await prisma.cliente.findUnique({
            where: {
                gimnasioId_dni: {
                    gimnasioId: gimnasio.id,
                    dni,
                },
            },
            select: {
                id: true,
                activo: true,
                membresias: {
                    where: {
                        gimnasioId: gimnasio.id,
                        fechaInicio: {
                            lte: fechaActual,
                        },
                    },
                    orderBy: {
                        fechaVencimiento: "desc",
                    },
                    take: 1,
                    select: {
                        fechaVencimiento: true,
                    },
                },
            },
        });

        if (!cliente) {
            return {
                tipo: "no_matriculado",
                mensaje: "Alumno no matriculado.",
            };
        }

        const membresia = cliente.membresias[0];

        const vencimiento = membresia
            ? membresia.fechaVencimiento.toISOString().slice(0, 10)
            : undefined;

        const tieneMembresiaVigente =
            cliente.activo &&
            vencimiento !== undefined &&
            vencimiento >= fechaLima;

        let diasRestantes: number | undefined;

        if (tieneMembresiaVigente && vencimiento) {
            const hoyUTC = new Date(`${fechaLima}T00:00:00.000Z`);
            const vencimientoUTC = new Date(
                `${vencimiento}T00:00:00.000Z`
            );

            diasRestantes = Math.round(
                (vencimientoUTC.getTime() - hoyUTC.getTime()) /
                    (1000 * 60 * 60 * 24)
            );
        }

        const estado = tieneMembresiaVigente
            ? "REGISTRADA"
            : "VENCIDA";

        await prisma.asistencia.create({
            data: {
                gimnasioId: gimnasio.id,
                clienteId: cliente.id,
                dniIngresado: dni,
                estado,
            },
        });

        if (tieneMembresiaVigente) {
            return {
                tipo: "registrada",
                mensaje: "Asistencia registrada correctamente.",
                fechaVencimiento: vencimiento,
                diasRestantes,
            };
        }

        return {
            tipo: "vencida",
            mensaje: vencimiento
                ? "Su membresía ya venció. Comuníquese con su gimnasio para su renovación."
                : "No tienes una membresía vigente. Comunícate con tu gimnasio para matricularte o renovar.",
            fechaVencimiento: vencimiento,
        };
    } catch (error) {
        console.error("Error al consultar asistencia:", error);

        return {
            tipo: "error",
            mensaje:
                "No pudimos consultar tu asistencia. Inténtalo nuevamente.",
        };
    }
}