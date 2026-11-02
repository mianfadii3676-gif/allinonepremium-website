import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Order } from "@/lib/models";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { updateOrder } from "@/lib/orders/orderService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const revisionIndex = Number(body.revisionIndex);

    if (isNaN(revisionIndex) || revisionIndex < 0) {
      return NextResponse.json({ success: false, message: "Valid revisionIndex is required" }, { status: 400 });
    }

    const order = await Order.findById(id).select("+revisions");
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const targetRev = order.revisions?.[revisionIndex];
    if (!targetRev || !targetRev.snapshot) {
      return NextResponse.json({ success: false, message: "Target revision snapshot not found" }, { status: 404 });
    }

    const snap = targetRev.snapshot;
    const updated = await updateOrder(id, {
      customer: snap.customer,
      items: snap.items,
      deliveryCharge: snap.deliveryCharge,
      discount: snap.discount,
      status: snap.status,
      courier: snap.courier,
      trackingNumber: snap.trackingNumber,
      cancellationReason: snap.cancellationReason,
      adminNotes: snap.adminNotes,
      note: `Reverted to revision from ${new Date(targetRev.at).toLocaleString("en-PK")}`,
    });

    return NextResponse.json({
      success: true,
      order: updated,
      message: "Order reverted successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to revert order" },
      { status: 500 }
    );
  }
}
