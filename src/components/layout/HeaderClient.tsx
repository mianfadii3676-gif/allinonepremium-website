"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Search, Menu, X, ChevronDown, ChevronRight, Truck, BadgeCheck, Headphones, Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import Logo from "./Logo";

const noopSubscribe = () => () => {};

interface HeaderCategory {
  name: string;
  slug: string;
  description: string;
}

interface Suggestion {
  slug: string;
  name: string;
  price: number;
  image?: string;
}

const announcementIcons = [Truck, BadgeCheck, Headphones];

export default function HeaderClient({
  announcements,
  categories,
}: {
  announcements: string[];
  categories: HeaderCategory[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus when the route changes (adjusting state during render instead of in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setCatOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const dialog = document.querySelector<HTMLElement>("[data-mobile-menu]");
    const focusable = () => dialog?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        mobileMenuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(focusable() || []);
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog?.querySelector<HTMLElement>("button[aria-label='Close menu']")?.focus();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (!catOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!catRef.current?.contains(e.target as Node)) setCatOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCatOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [catOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);


  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop All", href: "/shop" },
    { name: "Best Sellers", href: "/shop?sort=popular" },
    { name: "New Arrivals", href: "/shop?sort=newest" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <>
      {announcements.length > 0 && (
        <div className="bg-night text-white text-[12px] font-medium">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-center md:justify-between gap-6 overflow-hidden">
            {announcements.map((text, i) => {
              const Icon = announcementIcons[i % announcementIcons.length];
              return (
                <p key={text} className={`items-center gap-2 whitespace-nowrap text-[11px] tracking-wide text-white/80 ${i === 0 ? "flex" : "hidden md:flex"}`}>
                  <Icon className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
                  {text}
                </p>
              );
            })}
          </div>
        </div>
      )}

      <header
        className={`sticky top-0 z-40 transition-[background,box-shadow] duration-300 bg-night border-b border-white/10 ${
          scrolled ? "backdrop-blur-md shadow-[0_10px_24px_-14px_rgba(23,33,31,0.7)]" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center gap-4 lg:gap-8 transition-[height] duration-300 ${scrolled ? "h-16" : "h-[72px] lg:h-20"}`}>
            <button
              ref={mobileMenuButtonRef}
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-white/85 hover:text-white hover:bg-white/10"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-6 w-6" />
            </button>

            <Logo showTagline={!scrolled} />

            <nav className="hidden lg:flex items-center gap-1 ml-2" aria-label="Primary">
              {navLinks.slice(0, 2).map((link) => (
                <NavLink key={link.href} href={link.href} active={isActive(link.href)}>
                  {link.name}
                </NavLink>
              ))}
              <div className="relative" ref={catRef}>
                <button
                  onClick={() => setCatOpen((o) => !o)}
                  aria-expanded={catOpen}
                  aria-controls="category-menu"
                  aria-haspopup="true"
                  className={`flex items-center gap-1 px-3 py-2 text-[14px] font-semibold rounded-[8px] transition ${
                    catOpen ? "bg-white text-navy-950" : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Categories
                  <ChevronDown className={`h-4 w-4 transition-transform ${catOpen ? "rotate-180" : ""}`} />
                </button>
                {catOpen && (
                <div id="category-menu" role="region" aria-label="Product categories" className="absolute left-0 top-full mt-3 w-[480px] rounded-[14px] bg-white shadow-[var(--shadow-lift)] border border-line-soft p-3 grid grid-cols-2 gap-1">
                    {categories.length === 0 && <p className="col-span-2 p-3 text-sm text-ink-faint">No categories yet.</p>}
                    {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/shop?category=${c.slug}`}
                    onClick={() => setCatOpen(false)}
                        className="group rounded-xl px-3 py-2.5 hover:bg-paper-deep focus-visible:bg-paper-deep"
                      >
                        <span className="block text-[14px] font-semibold text-ink group-hover:text-gold-600">{c.name}</span>
                        {c.description && <span className="block text-[12px] text-ink-faint line-clamp-1 mt-0.5">{c.description}</span>}
                      </Link>
                    ))}
                <Link href="/shop" onClick={() => setCatOpen(false)} className="col-span-2 mt-1 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-navy-700 flex items-center justify-between bg-paper-deep hover:bg-line-soft">
                      Browse all products <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
              {navLinks.slice(2).map((link) => (
                <NavLink key={link.href} href={link.href} active={isActive(link.href)}>
                  {link.name}
                </NavLink>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <div className="hidden md:block w-[260px] xl:w-[320px]">
                <SearchBox />
              </div>
              <Link
                href="/shop"
                className="md:hidden p-2.5 rounded-full text-white/85 hover:text-white hover:bg-white/10"
                aria-label="Search products"
              >
                <Search className="h-5 w-5" />
              </Link>
              <CartButton />
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" data-mobile-menu>
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm panel-dark text-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 h-[72px] border-b border-white/10">
              <Logo showTagline={false} />
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-white/10" aria-label="Close menu" autoFocus>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-5 border-b border-white/10">
              <SearchBox />
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Mobile">
              {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-3 rounded-xl text-[16px] font-semibold ${
                    isActive(link.href) ? "text-white chip-hot" : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  {link.name}
                  <ChevronRight className="h-4 w-4 text-white/40" />
                </Link>
              ))}
              {categories.length > 0 && (
                <>
                  <p className="px-3 pt-5 pb-2 text-[11px] font-semibold tracking-wide text-gold-300">Categories</p>
                  {categories.map((c) => (
                    <Link key={c.slug} href={`/shop?category=${c.slug}`} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-[15px] text-white/75 hover:text-white hover:bg-white/10">
                      {c.name}
                    </Link>
                  ))}
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative px-3.5 py-2 text-[14px] font-semibold rounded-[8px] transition ${active ? "bg-white text-navy-950" : "text-white/80 hover:text-white hover:bg-white/10"}`}
    >
      {children}
    </Link>
  );
}

function CartButton() {
  const openCart = useCartStore((s) => s.openCart);
  const count = useCartStore((s) => s.items.reduce((n, it) => n + it.quantity, 0));
  // The cart is persisted in localStorage, so only show the count after hydration to avoid a mismatch.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const shown = mounted ? count : 0;

  return (
    <button
      onClick={openCart}
      data-cart-target
      className="relative p-2.5 rounded-[10px] text-white bg-white/10 hover:bg-white hover:text-navy-950 transition border border-white/20"
      aria-label={`Open cart, ${shown} item${shown === 1 ? "" : "s"}`}
    >
      <ShoppingCart className="h-[22px] w-[22px]" />
      {shown > 0 && (
        <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full chip-hot text-[11px] font-bold flex items-center justify-center tabular-nums ring-2 ring-white">
          {shown > 99 ? "99+" : shown}
        </span>
      )}
    </button>
  );
}

function SearchBox() {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const boxRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(term)}&limit=6`, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error();
        setResults(
          (data.products || []).map((p: { slug: string; name: string; price: number; images?: { url: string }[] }) => ({
            slug: p.slug,
            name: p.name,
            price: p.price,
            image: p.images?.[0]?.url,
          }))
        );
        setError(false);
        setHighlight(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const showPanel = open && q.trim().length >= 2;
  const isLoading = loading && showPanel;

  return (
    <form
      ref={boxRef}
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        if (highlight >= 0 && results[highlight]) router.push(`/products/${results[highlight].slug}`);
        else if (term) router.push(`/shop?search=${encodeURIComponent(term)}`);
        setOpen(false);
      }}
    >
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search products
      </label>
      <input
        id={`${listId}-input`}
        type="search"
        value={q}
        autoComplete="off"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-activedescendant={highlight >= 0 ? `${listId}-${highlight}` : undefined}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, -1));
          } else if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search mobiles, audio, watches…"
        className="w-full h-11 rounded-[10px] bg-white border border-line pl-5 pr-11 text-[14px] font-medium text-ink placeholder-ink-faint focus:outline-none focus:border-navy-700 transition"
      />
      <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-navy-700 text-white hover:bg-navy-800" aria-label="Submit search">
        {isLoading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Search className="h-[18px] w-[18px]" />}
      </button>

      {showPanel && (
        <div id={listId} role="listbox" className="absolute z-50 left-0 right-0 top-full mt-2 rounded-[12px] bg-white text-ink shadow-[var(--shadow-lift)] border border-line-soft overflow-hidden">
          {error ? (
            <p className="px-4 py-4 text-sm text-sale">Search is unavailable right now. Press Enter to search the shop.</p>
          ) : !isLoading && results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-ink-faint">No products match “{q.trim()}”.</p>
          ) : (
            <ul className="py-1.5">
              {results.map((r, i) => (
                <li key={r.slug} id={`${listId}-${i}`} role="option" aria-selected={i === highlight}>
                  <Link
                    href={`/products/${r.slug}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 ${i === highlight ? "bg-paper-deep" : "hover:bg-paper"}`}
                  >
                    <span className="relative h-10 w-10 rounded-lg bg-paper-deep overflow-hidden shrink-0">
                      {r.image && <Image src={r.image} alt="" fill sizes="40px" className="object-cover" />}
                    </span>
                    <span className="flex-1 min-w-0 text-[14px] font-medium truncate">{r.name}</span>
                    <span className="text-[13px] font-semibold tabular-nums text-ink-soft">Rs. {r.price.toLocaleString("en-PK")}</span>
                  </Link>
                </li>
              ))}
              {results.length > 0 && (
                <li>
                  <button type="submit" className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-gold-600 hover:bg-paper border-t border-line-soft">
                    {`See all results for “${q.trim()}”`}
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
