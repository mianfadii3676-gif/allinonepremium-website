import PageHeader from "@/components/layout/PageHeader";
import { RotateCcw, Truck, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function PoliciesPage() {
  return (
    <>
    <PageHeader crumb="Policies" title="Policies & guarantees" intro="Honest terms, so you can buy with confidence." />
  <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <div className="space-y-6 mt-10">
        <section id="returns" className="scroll-mt-28 bg-white border border-line rounded-2xl p-6 sm:p-8 paper-card">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-navy-700" />
            <h2 className="font-display text-2xl text-ink">7-day replacement</h2>
          </div>
          <div className="text-[15px] text-ink-soft space-y-3 leading-relaxed mt-4">
            <p>
              If your item arrives with a defect, a charging fault, or transit damage, we replace it —
              no debate — within 7 days of delivery.
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Keep the original box, cables and paperwork.</li>
              <li>WhatsApp us your order number and a short video of the issue.</li>
              <li>A replacement ships within 24–48 hours.</li>
            </ul>
          </div>
        </section>

        <section id="shipping" className="scroll-mt-28 bg-white border border-line rounded-2xl p-6 sm:p-8 paper-card">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-ink" />
            <h2 className="font-display text-2xl text-ink">Shipping & cash on delivery</h2>
          </div>
          <div className="text-[15px] text-ink-soft space-y-3 leading-relaxed mt-4">
            <p>We ship to every city and postal code in Pakistan.</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li><strong className="text-ink">Free delivery</strong> on orders above Rs. 3,000.</li>
              <li>Flat Rs. 200 on orders below that.</li>
              <li>2–3 days to major cities, 3–4 days everywhere else.</li>
              <li>Pay the exact invoice amount to the courier.</li>
            </ul>
          </div>
        </section>

        <section id="privacy" className="scroll-mt-28 bg-white border border-line rounded-2xl p-6 sm:p-8 paper-card">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-ink" />
            <h2 className="font-display text-2xl text-ink">Privacy</h2>
          </div>
          <div className="text-[15px] text-ink-soft space-y-3 leading-relaxed mt-4">
            <p>
              Your name, phone and address are used only to fulfil your order and send courier updates.
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>We never sell or share your details with advertisers.</li>
              <li>Admin access is password-hashed and role-restricted.</li>
            </ul>
          </div>
        </section>
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-paper-deep border border-line flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-[15px] text-ink">
          <HelpCircle className="h-5 w-5 text-ink shrink-0" />
          <span>Still have a question?</span>
        </p>
        <Link
          href="/contact"
          className="btn-ink px-6 py-2.5 rounded-full text-sm font-medium shrink-0"
        >
          Talk to us
        </Link>
      </div>
    </div>
    </>
  );
}
