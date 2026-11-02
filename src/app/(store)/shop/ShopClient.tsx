"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { IProduct, ICategory } from "@/types";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface ShopClientProps {
  initialProducts: IProduct[];
  categories: ICategory[];
  totalProducts: number;
  currentCategory?: string;
  currentSort?: string;
  currentSearch?: string;
}

export default function ShopClient({
  initialProducts,
  categories,
  totalProducts,
  currentCategory = "all",
  currentSort = "featured",
  currentSearch = "",
}: ShopClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentSearch);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/shop?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange("search", search.trim());
  };

  const clearAllFilters = () => {
    setSearch("");
    router.push("/shop");
  };

  const sorts = [
    { label: "Featured", value: "featured" },
    { label: "Price: low to high", value: "price-asc" },
    { label: "Price: high to low", value: "price-desc" },
    { label: "Newest", value: "newest" },
    { label: "Most popular", value: "popular" },
  ];

  const activeCategoryName =
    categories.find((c) => c.slug === currentCategory)?.name || "All products";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="text-sm text-ink-faint">A considered selection for daily life</p>
        <h1 className="font-display text-4xl sm:text-5xl text-ink tracking-tight mt-2">
          {activeCategoryName}
        </h1>
        <p className="text-ink-soft mt-3">
          {totalProducts} {totalProducts === 1 ? "item" : "items"} in the collection
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 mt-8 pb-6 border-b border-line">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md" role="search">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the catalogue…"
            className="w-full bg-white border border-line rounded-[10px] pl-11 pr-10 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                handleFilterChange("search", "");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-3">
          <label htmlFor="shop-sort" className="text-sm text-ink-faint sr-only">
            Sort products
          </label>
          <select
            id="shop-sort"
            value={currentSort}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
            className="bg-white border border-line rounded-[10px] px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10 cursor-pointer"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden btn-line flex items-center gap-2 px-4 py-2.5 rounded-full text-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Categories</span>
          </button>
        </div>
      </div>

      <div className="hidden md:flex flex-wrap items-center gap-2 py-5">
        <button
          onClick={() => handleFilterChange("category", "all")}
          className={`px-4 py-2 rounded-full text-sm transition ${
            currentCategory === "all"
              ? "bg-navy-700 text-white"
              : "border border-line text-ink-soft hover:border-navy-700 hover:text-ink"
          }`}
        >
          All items
        </button>

        {categories.map((cat) => {
          const isActive = currentCategory === cat.slug;
          return (
            <button
              key={cat._id?.toString() || cat.slug}
              onClick={() => handleFilterChange("category", cat.slug)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                isActive
                  ? "bg-navy-700 text-white"
                  : "border border-line text-ink-soft hover:border-navy-700 hover:text-ink"
              }`}
            >
              {cat.name}
            </button>
          );
        })}

        {(currentCategory !== "all" || currentSearch) && (
          <button
            onClick={clearAllFilters}
            className="ml-auto text-sm text-navy-700 hover:underline underline-offset-4"
          >
            Clear filters
          </button>
        )}
      </div>

      {mobileFilterOpen && (
        <div className="md:hidden py-4 border-b border-line flex flex-wrap gap-2">
          <button
            onClick={() => {
              handleFilterChange("category", "all");
              setMobileFilterOpen(false);
            }}
            className={`px-3 py-1.5 rounded-full text-sm ${
              currentCategory === "all" ? "bg-navy-700 text-white" : "border border-line text-ink-soft"
            }`}
          >
            All items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => {
                handleFilterChange("category", cat.slug);
                setMobileFilterOpen(false);
              }}
              className={`px-3 py-1.5 rounded-full text-sm ${
                currentCategory === cat.slug ? "bg-navy-700 text-white" : "border border-line text-ink-soft"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="pt-8">
        {initialProducts.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-line rounded-2xl bg-white/60 px-8">
            <SlidersHorizontal className="h-10 w-10 text-ink-faint mx-auto mb-4" />
            <h3 className="font-display text-2xl text-ink">Nothing matches</h3>
            <p className="text-[15px] text-ink-faint mt-2 max-w-sm mx-auto">
              No items fit those filters. Try widening the search.
            </p>
            <button
              onClick={clearAllFilters}
              className="btn-ink mt-6 px-6 py-2.5 rounded-full text-sm font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {initialProducts.map((p) => (
              <ProductCard key={p._id?.toString() || p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
