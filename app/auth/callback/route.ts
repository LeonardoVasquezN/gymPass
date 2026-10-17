import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  const redirigirLogin = (error: string) => {
    const url = new URL("/login", origin);
    url.searchParams.set("error", error);
    return NextResponse.redirect(url);
  };

  if (!code) {
    return redirigirLogin("google_error");
  }

  try {
    const supabase = await createClient();

    const { error: errorIntercambio } =
      await supabase.auth.exchangeCodeForSession(code);

    if (errorIntercambio) {
      return redirigirLogin("google_error");
    }

    const { data, error: errorClaims } = await supabase.auth.getClaims();

    const userId = data?.claims?.sub;

    if (errorClaims || typeof userId !== "string") {
      await supabase.auth.signOut();
      return redirigirLogin("google_error");
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        id: userId,
      },
      select: {
        activo: true,
        gimnasio: {
          select: {
            activo: true,
          },
        },
      },
    });

    if (
      !usuario ||
      !usuario.activo ||
      !usuario.gimnasio.activo
    ) {
      await supabase.auth.signOut();
      return redirigirLogin("cuenta_no_autorizada");
    }

    return NextResponse.redirect(new URL("/admin", origin));
  } catch {
    return redirigirLogin("google_error");
  }
}