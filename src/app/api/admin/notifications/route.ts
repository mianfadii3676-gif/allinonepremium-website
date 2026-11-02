import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Notification } from "@/lib/models";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const [notifications, unreadCount] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ isRead: false }),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to load notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    await Notification.updateMany({ isRead: false }, { $set: { isRead: true } });
    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to mark notifications read" },
      { status: 500 }
    );
  }
}
