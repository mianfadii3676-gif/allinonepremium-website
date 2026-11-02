import PageHeader from "@/components/layout/PageHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getStorefrontData, formatPKR } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers about ordering, delivery, payment and returns at Allinonepermium.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const { info } = await getStorefrontData();
  const faqs = [
    {
      q: "How do I place an order?",
      a: "Add products to your cart, open the cart and choose Checkout. Enter your name, phone number and delivery address, then confirm your order.",
    },
    {
      q: "Which payment methods do you accept?",
      a: "We currently accept cash on delivery — you pay the rider when your order arrives.",
    },
    {
      q: "How much is delivery?",
      a:
        info.freeDeliveryThreshold > 0
          ? `Delivery is ${formatPKR(info.deliveryCharge)}, and free on orders over ${formatPKR(info.freeDeliveryThreshold)}.`
          : `Delivery is ${formatPKR(info.deliveryCharge)} per order.`,
    },
    { q: "Do you deliver all over Pakistan?", a: "Yes, we deliver to cities across Pakistan through our courier partners." },
    {
      q: "Can I return or exchange a product?",
      a: "Yes. Please read our return & exchange policy for eligibility and timelines, then contact us to start a return.",
      link: { href: "/policies#returns", label: "Return & exchange policy" },
    },
    {
      q: "How can I contact support?",
      a: [info.contactPhone && `Call or WhatsApp ${info.contactPhone}`, info.contactEmail && `email ${info.contactEmail}`].filter(Boolean).join(", or ") || "Use our contact page.",
      link: { href: "/contact", label: "Contact us" },
    },
  ];

  return (
    <>
    <PageHeader crumb="FAQ" title="Frequently asked questions" intro="Quick answers about orders, delivery, payments and returns." />
<section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="group paper-card rounded-[var(--radius-card)] px-5 open:pb-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown className="h-5 w-5 shrink-0 text-ink-faint transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
            {f.link && (
              <Link href={f.link.href} className="mt-3 inline-block text-[14px] font-semibold text-gold-600 underline underline-offset-4">
                {f.link.label}
              </Link>
            )}
          </details>
        ))}
      </div>
    </section>
    </>
  );
}
