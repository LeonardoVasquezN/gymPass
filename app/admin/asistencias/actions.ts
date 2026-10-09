"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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
            },
            orderBy: { creadoEn: "desc" },
            take: 1,
            select: {
                fechaInicio: true,
                fechaVencimiento: true,
            },
        },
    },
});

let estado:
    | "REGISTRADA"
    | "VENCIDA"
    | "DNI_NO_ENCONTRADO" = "DNI_NO_ENCONTRADO";

let clienteId: string | null = null;

if (cliente) {
    clienteId = cliente.id;

    const membresia = cliente.membresias[0];

    const fechaLima = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

    if (cliente.activo && membresia) {
        const inicio = membresia.fechaInicio.toISOString().slice(0, 10);
        const vencimiento = membresia.fechaVencimiento
            .toISOString()
            .slice(0, 10);

        if (inicio <= fechaLima && vencimiento >= fechaLima) {
            estado = "REGISTRADA";
        } else {
            estado = "VENCIDA";
        }
    } else {
        estado = "VENCIDA";
    }
}

await prisma.asistencia.create({
    data: {
        gimnasioId: usuario.gimnasioId,
        clienteId,
        dniIngresado: dni,
        estado,
    },
});

revalidatePath("/admin/asistencias");
revalidatePath("/admin");

redirect(`/admin/asistencias?mensaje=${estado.toLowerCase()}`);
}