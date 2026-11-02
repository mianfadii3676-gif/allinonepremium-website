import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Order } from "@/lib/models";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { updateOrder, OrderError } from "@/lib/orders/orderService";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;
    const order = await Order.findById(id).select("+revisions").lean();

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to load order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const order = await updateOrder(id, body);
    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    if (err instanceof OrderError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update order" },
      { status: 500 }
    );
  }
}
