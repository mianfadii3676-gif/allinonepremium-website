import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { StoreSettings } from "@/lib/models";

export async function GET() {
  try {
    await dbConnect();
    const settings = await StoreSettings.findOne().lean();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch store settings" },
      { status: 500 }
    );
  }
}
