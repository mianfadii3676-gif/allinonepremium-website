"use client";

import { useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { IProduct } from "@/types";

type Tab = { slug: string; name: string; id: string };

/** Best sellers with category tabs; filtering is client-side over the already-loaded list. */
export default function BestSellers({ products, tabs }: { products: IProduct[]; tabs: Tab[] }) {
  const [active, setActive] = useState("all");
  const activeId = tabs.find((t) => t.slug === active)?.id;
  const shown = (active === "all" ? products : products.filter((p) => String(p.category && typeof p.category === "object" ? p.category._id : p.category) === activeId)).slice(0, 10);

  return (
    <>
      <div role="tablist" aria-label="Filter best sellers" className="mt-5 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {[{ slug: "all", name: "All Products", id: "" }, ...tabs].map((t) => (
          <button
            key={t.slug}
            role="tab"
            aria-selected={active === t.slug}
            onClick={() => setActive(t.slug)}
            className={`shrink-0 h-9 px-4 rounded-full text-[13px] font-semibold border transition ${
              active === t.slug ? "bg-night text-white border-night" : "bg-white text-ink-soft border-line hover:border-navy-700 hover:text-navy-700"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
      {shown.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {shown.map((p) => (
            <ProductCard key={String(p._id)} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line bg-white py-12 text-center text-sm text-ink-faint">
          No best sellers in this category yet.
        </p>
      )}
    </>
  );
}
