"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IProduct, IProductVariant } from "@/types";
import { useCartStore } from "@/lib/store/cartStore";
import { toast } from "@/lib/store/toastStore";
import { flyToCart } from "@/lib/ui/flyToCart";
import ProductCard from "@/components/product/ProductCard";
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingBag,
  Check,
  ChevronRight,
  MessageCircle,
  Plus,
  Minus,
} from "lucide-react";

export default function ProductDetailClient({
  product,
  relatedProducts = [],
}: {
  product: IProduct;
  relatedProducts?: IProduct[];
}) {
  const router = useRouter();
  const { addItem, openCart } = useCartStore();

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [{ url: "/placeholder.svg", alt: product.name }];

  const mainImageRef = useRef<HTMLDivElement>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(
    product.primaryImageIndex || 0
  );
  const [selectedVariant, setSelectedVariant] = useState<IProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const currentPrice = product.price + (selectedVariant?.priceModifier || 0);
  const originalPrice = product.originalPrice;
  const discountPercent =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    setIsAdding(true);
    addItem(product, selectedVariant, quantity, false);
    flyToCart(mainImageRef.current);
    toast.success("Added to cart", `${quantity} × ${product.name} added.`);
    setTimeout(() => setIsAdding(false), 800);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, selectedVariant, quantity);
    openCart();
    router.push("/checkout");
  };

  const whatsappMessage = encodeURIComponent(
    `Hello allinonepermium.store, I would like to ask about "${product.name}" (SKU: ${product.sku}, Price: Rs. ${currentPrice.toLocaleString()}).`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <nav className="flex items-center gap-2 text-[13px] text-ink-faint mb-8 overflow-x-auto whitespace-nowrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink transition">Home</Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href="/shop" className="hover:text-ink transition">Shop</Link>
        {product.category && typeof product.category === "object" && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link
              href={`/shop?category=${(product.category as { slug?: string }).slug}`}
              className="hover:text-ink transition"
            >
              {(product.category as { name?: string }).name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-ink font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto shrink-0">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border transition shrink-0 ${
                    activeImageIndex === idx
                      ? "border-ink ring-2 ring-ink/20"
                      : "border-line opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <Image src={img.url} alt={img.alt || product.name} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}

          <div ref={mainImageRef} className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-paper-deep border border-line">
            <Image
              src={images[activeImageIndex]?.url || images[0].url}
              alt={images[activeImageIndex]?.alt || product.name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              {product.isNewArrival && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-night text-white">
                  New arrival
                </span>
              )}
              {discountPercent > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/95 text-navy-700 border border-line">
                  Save {discountPercent}%
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-faint">
              {product.sku}
            </span>
            {/* Only real ratings are shown; products without reviews show no rating. */}
            {product.reviewCount && product.reviewCount > 0 && product.rating ? (
              <span className="flex items-center gap-1.5 text-[13px]" aria-label={`Rated ${product.rating.toFixed(1)} out of 5`}>
                <Star className="h-4 w-4 fill-navy-700 text-navy-700" />
                <span className="font-medium text-ink tabular-nums">{product.rating.toFixed(1)}</span>
                <span className="text-ink-faint tabular-nums">({product.reviewCount})</span>
              </span>
            ) : null}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-tight leading-tight mt-3">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-3xl font-semibold text-ink tabular-nums">
              Rs. {currentPrice.toLocaleString()}
            </span>
            {originalPrice && originalPrice > currentPrice && (
              <span className="text-base text-ink-faint line-through tabular-nums">
                Rs. {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-sm text-ink mt-1.5 flex items-center gap-1.5">
            <Truck className="h-4 w-4" />
            <span>Cash on delivery, anywhere in Pakistan</span>
          </p>

          <p className="text-[15px] text-ink-soft leading-relaxed mt-5">{product.description}</p>

          <p className="mt-4">
            {isOutOfStock ? (
              <span className="inline-block px-3 py-1.5 rounded-full bg-night/5 border border-line text-ink-faint text-[13px] font-medium">
                Out of stock
              </span>
            ) : isLowStock ? (
              <span className="inline-block px-3 py-1.5 rounded-full bg-navy-700/10 border border-navy-700/30 text-navy-700 text-[13px] font-medium">
                Only {product.stock} left
              </span>
            ) : (
              <span className="inline-block px-3 py-1.5 rounded-full bg-night/10 border border-ink/20 text-ink text-[13px] font-medium">
                In stock
              </span>
            )}
          </p>

          {product.variants && product.variants.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-ink">
                Option: <span className="font-normal text-ink-soft">{selectedVariant?.value}</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.value === v.value;
                  return (
                    <button
                      key={v.value}
                      onClick={() => setSelectedVariant(v)}
                      aria-pressed={isSelected}
                      className={`px-4 py-2.5 rounded-full text-sm transition ${
                        isSelected
                          ? "bg-night text-white"
                          : "border border-line text-ink-soft hover:border-ink hover:text-ink"
                      }`}
                    >
                      {v.value}
                      {v.priceModifier && v.priceModifier > 0 ? (
                        <span className="ml-1 opacity-70">+Rs. {v.priceModifier}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-7">
            <div className="flex items-center border border-line rounded-full bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 pl-3.5 text-ink-soft hover:text-ink transition disabled:opacity-40"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold text-[15px] text-ink tabular-nums" aria-live="polite">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-2.5 pr-3.5 text-ink-soft hover:text-ink transition disabled:opacity-40"
                disabled={quantity >= product.stock}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              className="btn-line flex-1 py-3 px-5 rounded-full font-medium text-[15px] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAdding ? (
                <>
                  <Check className="h-4 w-4 text-ink" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  <span>Add to bag</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="btn-ink w-full py-4 px-6 rounded-full font-medium text-[15px] mt-3 disabled:opacity-50"
          >
            Order now — pay cash on delivery
          </button>

          <div className="mt-5 p-4 rounded-xl bg-night/5 border border-ink/15 flex items-center justify-between gap-4">
            <p className="text-sm text-ink">
              <span className="font-medium">Questions first?</span>
              <span className="text-ink-soft"> Ask us on WhatsApp.</span>
            </p>
            <a
              href={`https://wa.me/923001234567?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-night text-white text-sm font-medium hover:bg-night transition shrink-0"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-4 text-[13px] text-ink-soft">
            <div className="flex items-center gap-2 p-3 rounded-xl border border-line bg-white">
              <RotateCcw className="h-4 w-4 text-navy-700 shrink-0" />
              <span>7-day replacement</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl border border-line bg-white">
              <ShieldCheck className="h-4 w-4 text-ink shrink-0" />
              <span>Verified original</span>
            </div>
          </div>
        </div>
      </div>

      {product.specifications && product.specifications.length > 0 && (
        <div className="mt-16 pt-10 border-t border-line">
          <h2 className="font-display text-2xl text-ink mb-6">Specifications</h2>
          <dl className="bg-white border border-line rounded-2xl overflow-hidden divide-y divide-line">
            {product.specifications.map((spec, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-3 px-5 sm:px-6 py-4 text-[15px]">
                <dt className="text-ink-faint">{spec.key}</dt>
                <dd className="sm:col-span-2 text-ink font-medium mt-1 sm:mt-0">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-10 border-t border-line">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-2xl text-ink">Pairs well with</h2>
            <Link href="/shop" className="text-sm text-ink font-medium hover:underline underline-offset-4">
              View catalogue
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id?.toString() || p.slug} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
