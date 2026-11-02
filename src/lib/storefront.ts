import { cache } from "react";
import dbConnect from "@/lib/db";
import { Category, StoreSettings } from "@/lib/models";
import { PaymentMethod } from "@/types";

export { BRAND } from "@/lib/brand";

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

export interface StorefrontInfo {
  contactEmail: string;
  contactPhone: string;
  address: string;
  freeDeliveryThreshold: number;
  deliveryCharge: number;
  paymentMethods: PaymentMethod[];
  socialLinks: { facebook?: string; instagram?: string; twitter?: string; whatsapp?: string };
}

/** Settings + active categories shared by header, footer and homepage. Deduplicated per request. */
export const getStorefrontData = cache(async (): Promise<{ info: StorefrontInfo; categories: NavCategory[] }> => {
  await dbConnect();
  const [settings, categories] = await Promise.all([
    StoreSettings.findOne().lean(),
    Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).limit(12).lean(),
  ]);

  return {
    info: {
      contactEmail: settings?.contactEmail || "",
      contactPhone: settings?.contactPhone || "",
      address: settings?.address || "",
      freeDeliveryThreshold: settings?.freeDeliveryThreshold ?? 0,
      deliveryCharge: settings?.deliveryCharge ?? 0,
      paymentMethods: settings?.paymentMethods?.length ? settings.paymentMethods : [PaymentMethod.CASH_ON_DELIVERY],
      socialLinks: {
        facebook: settings?.socialLinks?.facebook || "",
        instagram: settings?.socialLinks?.instagram || "",
        twitter: settings?.socialLinks?.twitter || "",
        whatsapp: settings?.socialLinks?.whatsapp || "",
      },
    },
    categories: categories.map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      imageUrl: c.image?.url || "",
    })),
  };
});

export function formatPKR(value: number): string {
  return `Rs. ${Math.round(value).toLocaleString("en-PK")}`;
}

export function whatsappHref(number?: string): string {
  const digits = (number || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}
