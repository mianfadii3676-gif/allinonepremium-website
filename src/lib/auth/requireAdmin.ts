import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { AdminRole } from "@/types";

export async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user || !Object.values(AdminRole).includes(role as AdminRole)) {
    return {
      error: NextResponse.json(
        { success: false, message: "Unauthorized. Admin credentials required." },
        { status: 401 }
      ),
      user: null,
    };
  }

  return { error: null, user: session.user };
}
