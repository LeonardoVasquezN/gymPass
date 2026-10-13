"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function registrarAsistencia(formData: FormData) {
const dni = String(formData.get("dni") ?? "").trim();

if (!/^\d{8}$/.test(dni)) {
    redirect("/admin/asistencias?mensaje=dni_invalido");
}

const supabase = await createClient();
const { data, error } = await supabase.auth.getClaims();

if (error || !data?.claims || typeof data.claims.sub !== "string") {
    redirect("/login");
}

const usuario = await prisma.usuario.findUnique({
    where: { id: data.claims.sub },
    select: {
        gimnasioId: true,
        activo: true,
        gimnasio: {
            select: { activo: true },
        },
    },
});

if (!usuario || !usuario.activo || !usuario.gimnasio.activo) {
    redirect("/login");
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
            gimnasioId: usuario.gimnasioId,
            dni,
        },
    },
    select: {
        id: true,
        activo: true,
        membresias: {
            where: {
                gimnasioId: usuario.gimnasioId,
                fechaInicio: {
                    lte: fechaActual,
                },
                fechaVencimiento: {
                    gte: fechaActual,
                },
            },
            orderBy: {
                fechaVencimiento: "desc",
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
    redirect("/admin/asistencias?mensaje=dni_no_encontrado");
}

if (!cliente.activo) {
    redirect("/admin/asistencias?mensaje=cliente_inactivo");
}

const inicioDia = new Date(`${fechaLima}T05:00:00.000Z`);

const finDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);

const asistenciaExistente = await prisma.asistencia.findFirst({
    where: {
        gimnasioId: usuario.gimnasioId,
        clienteId: cliente.id,
        estado: {
            in: ["REGISTRADA", "VENCIDA"],
        },
        fechaHora: {
            gte: inicioDia,
            lt: finDia,
        },
    },
    select: {
        id: true,
    },
});

if (asistenciaExistente) {
    redirect("/admin/asistencias?mensaje=ya_asistio");
}

const estado =
    cliente.membresias.length > 0
        ? "REGISTRADA"
        : "VENCIDA";

try {
    await prisma.asistencia.create({
        data: {
            gimnasioId: usuario.gimnasioId,
            clienteId: cliente.id,
            dniIngresado: dni,
            estado,
        },
    });
} catch (error) {
    if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
    ) {
        redirect("/admin/asistencias?mensaje=ya_asistio");
    }

    throw error;
}

revalidatePath("/admin/asistencias");
revalidatePath("/admin");

redirect(`/admin/asistencias?mensaje=${estado.toLowerCase()}`);
}