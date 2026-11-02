import Link from "next/link";
import Image from "@/components/ui/SafeImage";
import dbConnect from "@/lib/db";
import { Product } from "@/lib/models";
import ProductCard from "@/components/product/ProductCard";
import NewsletterForm from "@/components/home/NewsletterForm";
import CategoryIcon from "@/components/home/CategoryIcon";
import BestSellers from "@/components/home/BestSellers";
import Reveal from "@/components/ui/Reveal";
import { getStorefrontData, formatPKR } from "@/lib/storefront";
import { IProduct, PaymentMethod } from "@/types";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  BadgeCheck,
  Headphones,
  Tag,
  PackageOpen,
} from "lucide-react";

export const revalidate = 60;

type LeanProduct = IProduct & { _id: { toString(): string } };

function serialize<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

export default async function HomePage() {
  await dbConnect();
  const { info, categories } = await getStorefrontData();

  const [featured, bestSellers, newArrivals] = await Promise.all([
    Product.find({ isPublished: true, isFeatured: true }).sort({ updatedAt: -1 }).limit(10).lean<LeanProduct[]>(),
    Product.find({ isPublished: true }).sort({ salesCount: -1, reviewCount: -1, createdAt: -1 }).limit(40).lean<LeanProduct[]>(),
    Product.find({ isPublished: true }).sort({ isNewArrival: -1, createdAt: -1 }).limit(5).lean<LeanProduct[]>(),
  ]);

  const heroProducts = featured.filter((p) => p.images?.[0]?.url).slice(0, 3);
  // Featured grid falls back to best sellers so the section is never empty.
  const featuredRow = (featured.length >= 5 ? featured : bestSellers).slice(0, 5);
  const hasCOD = info.paymentMethods.includes(PaymentMethod.CASH_ON_DELIVERY);

  return (
    <div>
      {/* ───────────── HERO ───────────── */}
      <section className="hero-stage-light relative overflow-hidden text-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-5">
            <p className="text-[13px] font-semibold text-navy-600">Mobile · Computer · Audio · Gadgets</p>
            <h1 className="font-display mt-4 text-[38px] leading-[1.04] sm:text-[50px] xl:text-[56px] font-bold tracking-[-0.035em]">
              Upgrade your tech.
              <br />
              Elevate your experience.
            </h1>
            <p className="mt-5 text-[16px] leading-relaxed text-white/70 max-w-md">
              Discover premium mobile accessories, computer essentials, and innovative gadgets designed for your everyday life.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-gold inline-flex items-center gap-2 px-6 h-12 text-[15px]">
                Explore Products <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/shop?sort=popular" className="btn-outline-light inline-flex items-center px-6 h-12 text-[15px]">
                Shop Best Sellers
              </Link>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] text-white/75">
              <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-navy-600" />Delivery across Pakistan</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-navy-600" />{hasCOD ? "Cash on delivery" : "Secure checkout"}</li>
              <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-navy-600" />Quality checked</li>
              <li className="flex items-center gap-2"><Headphones className="h-4 w-4 text-navy-600" />Order support</li>
            </ul>
          </div>
          <div className="lg:col-span-7 min-w-0">
            <HeroStage products={heroProducts} />
          </div>
        </div>
      </section>

      {/* ───────────── CATEGORIES ───────────── */}
      {categories.length > 0 && (
        <section id="categories" aria-labelledby="cat-heading" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
          <SectionHead id="cat-heading" title="Shop by Category" sub="Find the right gear for your phone, desk and setup." href="/shop" />
          <ul className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.slice(0, 10).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/shop?category=${c.slug}`}
                  className="group card-lift h-full flex flex-col rounded-[var(--radius-card)] bg-white border border-line-soft overflow-hidden"
                >
                  <span className="img-zoom relative block aspect-[4/3] bg-paper-deep overflow-hidden">
                    {c.imageUrl ? (
                      <Image src={c.imageUrl} alt="" fill sizes="(min-width: 1024px) 18vw, 45vw" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-navy-700">
                        <CategoryIcon slug={c.slug} className="h-10 w-10" />
                      </span>
                    )}
                  </span>
                  <span className="p-4 flex-1 flex flex-col">
                    <span className="text-[15px] font-semibold text-ink">{c.name}</span>
                    {c.description && <span className="mt-1 text-[12px] text-ink-faint line-clamp-2">{c.description}</span>}
                    <span className="mt-auto pt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-navy-700">
                      Shop Now <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ───────────── FEATURED ───────────── */}
      <section aria-labelledby="featured-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <SectionHead id="featured-heading" title="Featured Products" sub="Hand-picked essentials worth adding to your setup." href="/shop" />
        <ProductGrid products={featuredRow} />
      </section>

      {/* ───────────── PROMO BANNER ───────────── */}
      <section aria-labelledby="promo-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <Reveal>
          <div className="hero-stage-light rounded-[20px] overflow-hidden px-6 sm:px-12 py-12 sm:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-white">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-navy-700 px-2.5 py-1 text-[12px] font-semibold">
                <Tag className="h-3.5 w-3.5" /> Deals
              </span>
              <h2 id="promo-heading" className="font-display mt-4 text-[28px] sm:text-[36px] font-bold leading-tight">The right tech. The right price.</h2>
              <p className="mt-3 text-white/70 text-[15px]">Find your everyday essentials and upgrade your setup with our latest collections.</p>
            </div>
            <Link href="/shop?sort=price-asc" className="btn-gold shrink-0 inline-flex items-center gap-2 px-7 h-12 text-[15px] self-start md:self-auto">
              Explore Deals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ───────────── BEST SELLERS ───────────── */}
      <section aria-labelledby="best-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <SectionHead id="best-heading" title="Best Sellers" sub="What customers are ordering most right now." href="/shop?sort=popular" />
        {bestSellers.length > 0 ? (
          <BestSellers products={serialize(bestSellers)} tabs={categories.slice(0, 5).map((c) => ({ slug: c.slug, name: c.name, id: c.id }))} />
        ) : (
          <EmptyProducts />
        )}
      </section>

      {/* ───────────── NEW ARRIVALS ───────────── */}
      <section aria-labelledby="new-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <SectionHead id="new-heading" title="New Arrivals" sub="The latest additions to the store." href="/shop?sort=newest" />
        <ProductGrid products={newArrivals} badge="New" />
      </section>

      {/* ───────────── WHY SHOP WITH US ───────────── */}
      <section aria-labelledby="why-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <h2 id="why-heading" className="font-display text-[26px] sm:text-[30px] font-bold text-ink">Why shop with us?</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: BadgeCheck, title: "Quality Products", text: "Carefully selected technology essentials." },
            { icon: Tag, title: "Competitive Prices", text: "Great value on everyday gadgets." },
            { icon: ShieldCheck, title: "Secure Shopping", text: hasCOD ? "Smooth checkout with cash on delivery." : "A smooth and secure shopping experience." },
            { icon: Headphones, title: "Customer Support", text: "Assistance whenever you need it." },
          ].map((b) => (
            <div key={b.title} className="card-lift rounded-[var(--radius-card)] bg-white border border-line-soft p-6">
              <span className="h-11 w-11 rounded-xl bg-gold-50 flex items-center justify-center text-navy-700">
                <b.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[16px] font-semibold text-ink">{b.title}</h3>
              <p className="mt-1 text-[14px] text-ink-faint">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── NEWSLETTER ───────────── */}
      <section aria-labelledby="news-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <Reveal>
          <div className="panel-dark rounded-[20px] px-6 sm:px-12 py-10 grid lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5">
              <h2 id="news-heading" className="font-display text-[24px] sm:text-[28px] font-bold text-white">Stay updated with the latest tech</h2>
              <p className="mt-2 text-[14px] text-white/65">Subscribe to receive updates about new arrivals, exclusive deals, and special offers.</p>
            </div>
            <div className="lg:col-span-7">
              <NewsletterForm />
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function SectionHead({ id, title, sub, href }: { id: string; title: string; sub: string; href: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="font-display text-[26px] sm:text-[30px] font-bold text-ink">{title}</h2>
        <p className="mt-1 text-[14px] text-ink-faint">{sub}</p>
      </div>
      <Link href={href} className="shrink-0 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink hover:text-navy-700">
        View All <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function ProductGrid({ products, badge }: { products: LeanProduct[]; badge?: string }) {
  if (products.length === 0) return <EmptyProducts />;
  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {products.map((p, i) => (
        <Reveal key={p._id.toString()} delay={i * 60} className="h-full">
          <ProductCard product={serialize(p)} badge={badge} />
        </Reveal>
      ))}
    </div>
  );
}

function EmptyProducts() {
  return (
    <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line bg-white py-14 text-center">
      <PackageOpen className="h-8 w-8 mx-auto text-ink-faint" aria-hidden="true" />
      <p className="mt-3 font-semibold text-ink">New products are on their way</p>
      <p className="text-sm text-ink-faint mt-1">Check back soon — our catalogue is being stocked.</p>
    </div>
  );
}

/** Hero visual: one large featured product plus two smaller ones, each labelled with name and price. */
function HeroStage({ products }: { products: LeanProduct[] }) {
  if (products.length === 0) {
    return <div className="aspect-[16/11] rounded-[16px] border border-white/10 bg-white/[0.03]" aria-hidden="true" />;
  }
  const [main, ...rest] = products;
  return (
    <div className="grid grid-cols-5 grid-rows-2 gap-3 aspect-[16/11]">
      <HeroCard product={main} className="col-span-3 row-span-2" sizes="(min-width: 1024px) 26vw, 60vw" priority large />
      {rest.slice(0, 2).map((p) => (
        <HeroCard key={p.slug} product={p} className="col-span-2" sizes="(min-width: 1024px) 17vw, 40vw" />
      ))}
    </div>
  );
}

function HeroCard({
  product,
  className,
  sizes,
  priority = false,
  large = false,
}: {
  product: LeanProduct;
  className: string;
  sizes: string;
  priority?: boolean;
  large?: boolean;
}) {
  const img = product.images[0];
  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group img-zoom relative overflow-hidden rounded-[16px] bg-navy-800 ring-1 ring-white/10 hover:ring-navy-700 transition ${className}`}
    >
      <Image hideOnError src={img.url} alt={img.alt || product.name} fill priority={priority} sizes={sizes} className="object-cover" />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/20 to-transparent" />
      <span className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 ${large ? "p-5" : "p-3.5"}`}>
        <span className="min-w-0">
          <span className={`font-semibold text-white leading-tight line-clamp-2 ${large ? "block text-[18px]" : "hidden sm:block text-[13px]"}`}>{product.name}</span>
          <span className={`block mt-1 tabular-nums font-semibold text-white/80 ${large ? "text-[15px]" : "text-[12px]"}`}>{formatPKR(product.price)}</span>
        </span>
        {large && (
          <span className="shrink-0 h-10 w-10 rounded-[var(--radius-btn)] bg-white text-night flex items-center justify-center transition group-hover:bg-navy-700 group-hover:text-white">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </span>
    </Link>
  );
}
