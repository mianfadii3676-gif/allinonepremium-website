import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Order } from "@/lib/models";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { OrderStatus } from "@/types";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const unacknowledged = await Order.find({
      alertAcknowledged: false,
      source: "website",
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    // Website orders still carrying their temporary REQ- number are waiting for approval.
    const pendingApproval = await Order.countDocuments({ orderNumber: /^REQ-/, status: OrderStatus.PENDING });

    return NextResponse.json({
      success: true,
      pendingApproval,
      hasAlerts: unacknowledged.length > 0,
      count: unacknowledged.length,
      orders: unacknowledged,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to check order alerts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await req.json();
    const { orderId, acknowledgeAll } = body;

    if (acknowledgeAll) {
      await Order.updateMany({ alertAcknowledged: false }, { $set: { alertAcknowledged: true } });
    } else if (orderId) {
      await Order.findByIdAndUpdate(orderId, { $set: { alertAcknowledged: true } });
    }

    return NextResponse.json({ success: true, message: "Alerts acknowledged" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to acknowledge alerts" },
      { status: 500 }
    );
  }
}
