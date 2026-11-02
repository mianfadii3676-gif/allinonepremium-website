import { getStorefrontData, formatPKR } from "@/lib/storefront";
import { PaymentMethod } from "@/types";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const { info, categories } = await getStorefrontData();

  // Only claims backed by store settings are shown.
  const announcements = [
    info.freeDeliveryThreshold > 0
      ? `Free delivery on orders over ${formatPKR(info.freeDeliveryThreshold)}`
      : null,
    info.paymentMethods.includes(PaymentMethod.CASH_ON_DELIVERY) ? "Cash on delivery" : null,
    info.contactPhone ? `Support: ${info.contactPhone}` : null,
  ].filter((a): a is string => Boolean(a));

  return (
    <HeaderClient
      announcements={announcements}
      categories={categories.map(({ name, slug, description }) => ({ name, slug, description }))}
    />
  );
}
