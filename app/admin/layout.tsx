import { connection } from "next/server";
import AdminLayoutClient from "./admin-layout-client";
import { verificarSuperadministrador } from "@/lib/auth/superadmin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const { autorizado } = await verificarSuperadministrador();

  return (
    <AdminLayoutClient esSuperadministrador={autorizado}>
      {children}
    </AdminLayoutClient>
  );
}