import { auth } from "@/lib/auth";
import { AdminRole } from "@/types";
import { redirect } from "next/navigation";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user || !Object.values(AdminRole).includes(role as AdminRole)) {
    redirect("/admin/login");
  }

  return (
    <AdminLayoutClient
      user={{
        name: session.user.name,
        email: session.user.email,
        role,
      }}
    >
      {children}
    </AdminLayoutClient>
  );
}
