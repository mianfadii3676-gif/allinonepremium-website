import type { Metadata } from "next";
import { getStorefrontData } from "@/lib/storefront";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with allinonepermium for product questions, delivery updates, and order support.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const { info } = await getStorefrontData();
  return <ContactClient info={info} />;
}
