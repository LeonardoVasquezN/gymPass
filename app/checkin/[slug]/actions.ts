"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type EstadoConsulta = {
    tipo:
        | "inicial"
        | "no_matriculado"
        | "registrada"
        | "vencida"
        | "error"
        | "sin_membresia"
        | "cliente_inactivo"
        | "membresia_futura";

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
                    },
                    orderBy: {
                        fechaInicio: "desc",
                    },
                    take: 1,
                    select: {
                        fechaInicio: true,
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

        if (!cliente.activo) {
            return {
                tipo: "cliente_inactivo",
                mensaje: "Tu cuenta está inactiva. Comunícate con tu gimnasio.",
            };
        }

                const membresia = cliente.membresias[0];

        if (!membresia) {
            return {
                tipo: "sin_membresia",
                mensaje:
                    "No tienes una membresía registrada. Comunícate con tu gimnasio para matricularte.",
            };
        }

        const inicio = membresia.fechaInicio
            .toISOString()
            .slice(0, 10);

        const vencimiento = membresia.fechaVencimiento
            .toISOString()
            .slice(0, 10);

        if (inicio > fechaLima) {
            return {
                tipo: "membresia_futura",
                mensaje: `Tu membresía aún no comienza. Inicia el ${new Intl.DateTimeFormat(
                    "es-PE",
                    {
                        dateStyle: "long",
                        timeZone: "UTC",
                    }
                ).format(new Date(`${inicio}T00:00:00.000Z`))}.`,
                fechaVencimiento: vencimiento,
            };
        }

        const tieneMembresiaVigente = vencimiento >= fechaLima;

        if (tieneMembresiaVigente) {
            const hoyUTC = new Date(`${fechaLima}T00:00:00.000Z`);
            const vencimientoUTC = new Date(
                `${vencimiento}T00:00:00.000Z`
            );

            const diasRestantes = Math.round(
                (vencimientoUTC.getTime() - hoyUTC.getTime()) /
                    (1000 * 60 * 60 * 24)
            );

            await prisma.asistencia.create({
                data: {
                    gimnasioId: gimnasio.id,
                    clienteId: cliente.id,
                    dniIngresado: dni,
                    estado: "REGISTRADA",
                },
            });

            return {
                tipo: "registrada",
                mensaje: "Asistencia registrada correctamente.",
                fechaVencimiento: vencimiento,
                diasRestantes,
            };
        }

        await prisma.asistencia.create({
            data: {
                gimnasioId: gimnasio.id,
                clienteId: cliente.id,
                dniIngresado: dni,
                estado: "VENCIDA",
            },
        });

        return {
            tipo: "vencida",
            mensaje:
                "Su membresía ya venció. Comuníquese con su gimnasio para su renovación.",
            fechaVencimiento: vencimiento,
        };
            } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return {
                tipo: "error",
                mensaje: "Tu intento de asistencia ya fue registrado hoy.",
            };
        }

        console.error("Error al consultar asistencia:", error);

        return {
            tipo: "error",
            mensaje:
                "No pudimos consultar tu asistencia. Inténtalo nuevamente.",
        };
    }
}