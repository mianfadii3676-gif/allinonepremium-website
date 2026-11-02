import dbConnect from "@/lib/db";
import { StoreSettings } from "@/lib/models";
import SettingsClient from "./SettingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store Settings & Delivery Rules | allinonepermium Admin",
};

export const revalidate = 0;

export default async function AdminSettingsPage() {
  await dbConnect();
  let settings = await StoreSettings.findOne().lean();

  if (!settings) {
    settings = await StoreSettings.create({
      storeName: "allinonepermium.store",
      deliveryCharge: 200,
      freeDeliveryThreshold: 3000,
      lowStockThreshold: 5,
    });
  }

  return <SettingsClient initialSettings={JSON.parse(JSON.stringify(settings))} />;
}
