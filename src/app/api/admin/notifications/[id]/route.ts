import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Notification } from "@/lib/models";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;
    await Notification.findByIdAndUpdate(id, { $set: { isRead: true } });
    return NextResponse.json({ success: true, message: "Notification marked read" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;
    await Notification.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to delete notification" },
      { status: 500 }
    );
  }
}
