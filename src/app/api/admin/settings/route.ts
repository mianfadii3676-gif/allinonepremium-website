import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { StoreSettings } from "@/lib/models";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const settings = await StoreSettings.findOne().lean();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to load store settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await req.json();

    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings(body);
    } else {
      if (body.storeName) settings.storeName = body.storeName.trim();
      if (body.logoUrl !== undefined) settings.logoUrl = body.logoUrl.trim();
      if (body.tagline !== undefined) settings.tagline = body.tagline.trim();
      if (body.contactEmail !== undefined) settings.contactEmail = body.contactEmail.trim();
      if (body.contactPhone !== undefined) settings.contactPhone = body.contactPhone.trim();
      if (body.address !== undefined) settings.address = body.address.trim();
      if (body.deliveryCharge !== undefined) settings.deliveryCharge = Math.max(0, Number(body.deliveryCharge));
      if (body.freeDeliveryThreshold !== undefined) settings.freeDeliveryThreshold = Math.max(0, Number(body.freeDeliveryThreshold));
      if (body.currency) settings.currency = body.currency.trim().toUpperCase();
      if (body.socialLinks) settings.socialLinks = body.socialLinks;
      if (body.policies) settings.policies = body.policies;
      if (body.lowStockThreshold !== undefined) settings.lowStockThreshold = Math.max(1, Number(body.lowStockThreshold));
      if (body.isMaintenanceMode !== undefined) settings.isMaintenanceMode = Boolean(body.isMaintenanceMode);
    }

    await settings.save();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
