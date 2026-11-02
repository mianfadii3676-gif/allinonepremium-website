import PageHeader from "@/components/layout/PageHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gem, Truck, Headphones } from "lucide-react";
import { BRAND } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "About Us",
  description: "Allinonepermium brings premium gadgets, accessories, home essentials and lifestyle products together in one store for Pakistan.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader crumb="About Us" title="Everything useful, in one place." intro={`${BRAND.name} brings practical gadgets, accessories and everyday essentials together so you can choose well, order easily and receive your parcel across Pakistan.`} />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid md:grid-cols-3 gap-5">
        {[
          { icon: Gem, title: "Curated quality", text: "We select products from trusted suppliers and list clear specifications and prices." },
          { icon: Truck, title: "Delivered to your door", text: "We deliver across Pakistan, with cash on delivery so you pay when your order arrives." },
          { icon: Headphones, title: "Real people, real help", text: "Questions before or after your order? Our support team is here to help." },
        ].map((v) => (
        <div key={v.title} className="paper-card rounded-[12px] p-7">
            <span className="h-12 w-12 rounded-full bg-navy-950 text-gold-300 flex items-center justify-center">
              <v.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-lg font-bold text-ink">{v.title}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{v.text}</p>
          </div>
        ))}
      </section>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 text-center">
        <Link href="/shop" className="btn-ink inline-flex items-center gap-2 rounded-[10px] px-7 h-12 font-semibold">
          Start shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  );
}
