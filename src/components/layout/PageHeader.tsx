import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Shared title band for inner storefront pages: breadcrumb, heading and a short intro. */
export default function PageHeader({ title, crumb, intro }: { title: string; crumb: string; intro?: string }) {
  return (
    <section className="bg-white border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-ink-faint">
          <Link href="/" className="hover:text-navy-700">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-ink-soft">{crumb}</span>
        </nav>
        <h1 className="font-display mt-3 text-[32px] sm:text-[40px] font-bold text-ink leading-tight">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-[15px] text-ink-soft leading-relaxed">{intro}</p>}
      </div>
    </section>
  );
}
