import { createClient } from "@/lib/supabase/server";

export async function verificarSuperadministrador() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;
  const superAdminId = process.env.GYMPASS_SUPERADMIN_USER_ID;

  const autorizado =
    !error &&
    typeof userId === "string" &&
    typeof superAdminId === "string" &&
    userId === superAdminId;

  return {
    supabase,
    autorizado,
  };
}