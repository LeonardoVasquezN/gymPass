import { connection } from "next/server";
import { redirect } from "next/navigation";

import AdminLayoutClient from "../admin/admin-layout-client";
import { verificarSuperadministrador } from "@/lib/auth/superadmin";

export default async function SuperadminLayout({
children,
}: {
children: React.ReactNode;
}) {
await connection();

const { autorizado } = await verificarSuperadministrador();

if (!autorizado) {
  redirect("/admin");
}

return ( 
  <AdminLayoutClient esSuperadministrador={autorizado}>
    {children} </AdminLayoutClient>
  );
}