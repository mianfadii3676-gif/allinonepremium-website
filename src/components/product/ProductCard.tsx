"use client";

import Image from "@/components/ui/SafeImage";
import Link from "next/link";
import { Star, ShoppingCart, Check, ImageOff } from "lucide-react";
import { IProduct } from "@/types";
import { useCartStore } from "@/lib/store/cartStore";
import { toast } from "@/lib/store/toastStore";
import { useRef, useState } from "react";
import { flyToCart } from "@/lib/ui/flyToCart";
import Tilt3D from "@/components/ui/Tilt3D";

const sizes = "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

export default function ProductCard({
  product,
  priority = false,
  badge,
}: {
  product: IProduct;
  priority?: boolean;
  /** Optional merchandising badge, e.g. "Bestseller". */
  badge?: string;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const mediaRef = useRef<HTMLAnchorElement>(null);

  const images = product.images || [];
  const primaryImg = images[product.primaryImageIndex || 0]?.url || images[0]?.url;
  const secondaryImg = images.find((img) => img.url && img.url !== primaryImg)?.url;

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 5;
  const hasRating = Boolean(product.reviewCount && product.reviewCount > 0 && product.rating);
  const label = badge || (product.isNewArrival ? "New" : undefined);

  const handleAdd = () => {
    if (isOutOfStock || added) return;
    addItem(product, product.variants?.[0], 1, false);
    flyToCart(mediaRef.current);
    toast.success("Added to cart", `${product.name} has been added.`);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Tilt3D max={5} glare className="h-full rounded-[var(--radius-card)]">
    <article className="group h-full flex flex-col card-lift bg-white border border-line-soft rounded-2xl overflow-hidden">
      <Link
        href={`/products/${product.slug}`}
        ref={mediaRef}
        className="relative block aspect-square overflow-hidden bg-gradient-to-b from-paper to-paper-deep"
        aria-label={product.name}
      >
        {primaryImg ? (
          <>
            <Image
              src={primaryImg}
              alt={images[0]?.alt || product.name}
              fill
              priority={priority}
              sizes={sizes}
              className={`object-cover transition duration-500 ease-out ${secondaryImg ? "group-hover:opacity-0" : "group-hover:scale-[1.04]"}`}
            />
            {secondaryImg && (
              <Image
                src={secondaryImg}
                alt=""
                aria-hidden="true"
                fill
                sizes={sizes}
                className="object-cover opacity-0 transition duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.03]"
              />
            )}
          </>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-ink-faint">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
          </span>
        )}

        {label && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold shadow-sm border border-white/70 ${
              label === "New" ? "chip-royal" : label === "Hot" ? "chip-hot" : "chip-lime"
            }`}
          >
            {label}
          </span>
        )}
        {isOutOfStock ? (
          <span className="absolute inset-x-0 bottom-0 bg-night/90 text-white text-center text-xs font-medium py-2">Out of stock</span>
        ) : isLowStock ? (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-pop-orange text-[11px] font-bold border-2 border-pop-orange/30">
            Only {product.stock} left
          </span>
        ) : null}
      </Link>

      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/products/${product.slug}`} className="focus-visible:outline-none">
          <h3 className="text-[14px] font-semibold leading-snug text-ink line-clamp-2 min-h-[2.6em] group-hover:text-navy-700">
            {product.name}
          </h3>
        </Link>

        {hasRating && (
          <div className="flex items-center gap-1.5 mt-2" aria-label={`Rated ${product.rating!.toFixed(1)} out of 5 from ${product.reviewCount} reviews`}>
            <span className="flex" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(product.rating!) ? "fill-gold-400 text-gold-400" : "text-line"}`} />
              ))}
            </span>
            <span className="text-[12px] text-ink-faint tabular-nums" aria-hidden="true">
              ({product.rating!.toFixed(1)})
            </span>
          </div>
        )}

        <div className="mt-auto pt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[16px] font-bold text-ink tabular-nums">Rs. {product.price.toLocaleString("en-PK")}</span>
          {discountPercent > 0 && (
            <>
              <span className="text-[12px] text-ink-faint line-through tabular-nums">Rs. {product.originalPrice!.toLocaleString("en-PK")}</span>
              <span className="px-1.5 py-0.5 rounded-md chip-hot text-white text-[11px] font-bold tabular-nums">-{discountPercent}%</span>
            </>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`mt-3.5 w-full h-10 rounded-[10px] text-[13px] font-bold flex items-center justify-center gap-2 transition ${
            isOutOfStock
              ? "bg-paper-deep text-ink-faint cursor-not-allowed"
              : added
                ? "chip-lime"
                : "btn-gold"
          }`}
        >
          {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
          {isOutOfStock ? "Out of stock" : added ? "Added" : "Add to Cart"}
        </button>
      </div>
    </article>
    </Tilt3D>
  );
}
