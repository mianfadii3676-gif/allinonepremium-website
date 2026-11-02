import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Order } from "@/lib/models";
import { auth } from "@/lib/auth";
import { AdminRole } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const token = req.nextUrl.searchParams.get("t");
    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role;
    const isAdmin = Object.values(AdminRole).includes(role as AdminRole);

    let query: Record<string, unknown> = { orderNumber: id };

    // If not authenticated admin, require matching accessToken
    if (!isAdmin) {
      if (!token) {
        return NextResponse.json(
          { success: false, message: "Unauthorized order tracking request" },
          { status: 401 }
        );
      }
      query = { $or: [{ orderNumber: id }, { requestRef: id }], accessToken: token };
    }

    const order = await Order.findOne(query).lean();
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to retrieve order" },
      { status: 500 }
    );
  }
}
