import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Category } from "@/lib/models";

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
