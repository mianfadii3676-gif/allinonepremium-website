"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Volume2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { useAlertStore } from "@/lib/store/alertStore";
import { AdminAppControls, notifyNewOrder } from "@/components/admin/AdminPwa";

type AlertOrder = { _id: string; orderNumber: string; total: number; customer?: { name?: string; city?: string } };
type NavItem = { name: string; href: string; icon: typeof Bell; badge?: number; badgeTone?: "blue" | "red" };

const POLL_MS = 15000;

export default function AdminLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; role?: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingApproval, setPendingApproval] = useState(0);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Orders already announced, so each new request triggers exactly one system notification.
  const announced = useRef<Set<string> | null>(null);

  const { soundOn, setSoundOn, playAlertSound } = useAlertStore();

  useEffect(() => {
    let cancelled = false;

    const checkAlerts = async () => {
      try {
        const [alertsRes, notifRes] = await Promise.all([fetch("/api/admin/orders/alerts"), fetch("/api/admin/notifications")]);
        if (cancelled) return;

        if (alertsRes.ok) {
          const data: { hasAlerts: boolean; pendingApproval?: number; orders?: AlertOrder[] } = await alertsRes.json();
          setPendingApproval(data.pendingApproval || 0);
          if (data.hasAlerts && soundOn) playAlertSound();

          const orders = data.orders || [];
          if (announced.current === null) {
            // First poll after opening the panel: remember what's there without re-announcing it.
            announced.current = new Set(orders.map((o) => o._id));
          } else {
            for (const o of orders) {
              if (!announced.current.has(o._id)) {
                announced.current.add(o._id);
                notifyNewOrder(o);
              }
            }
          }
        }

        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setUnreadCount(notifData.unreadCount || 0);
        }
      } catch {
        // Ignore network polling glitches
      }
    };

    checkAlerts();
    const timer = setInterval(checkAlerts, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [soundOn, playAlertSound]);

  // Show the waiting count in the browser tab / app switcher.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = pendingApproval > 0 ? `(${pendingApproval}) ${base}` : base;
  }, [pendingApproval, pathname]);

  // Ctrl/Cmd + K focuses the global search; Escape closes the user menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  // Close the mobile drawer and user menu on navigation (state adjusted during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setSidebarOpen(false);
    setMenuOpen(false);
  }

  /** Order numbers, request refs and phone numbers go to Orders; anything else searches Products. */
  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    const looksLikeOrder = /^(aop|req)-/i.test(q) || /^[+\d][\d\s-]{6,}$/.test(q);
    router.push(`${looksLikeOrder ? "/admin/orders" : "/admin/products"}?search=${encodeURIComponent(q)}`);
    setSearch("");
    searchRef.current?.blur();
  }

  const main: NavItem[] = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag, badge: pendingApproval || undefined, badgeTone: "blue" },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: Layers },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Notifications", href: "/admin/notifications", icon: Bell, badge: unreadCount || undefined, badgeTone: "red" },
  ];

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const navLink = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`group flex items-center gap-3.5 h-11 px-3.5 rounded-xl text-[15px] font-medium transition-colors ${
          active ? "bg-blue-600 text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.7)]" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
        <span className="flex-1">{item.name}</span>
        {item.badge !== undefined ? (
          <span
            className={`min-w-6 h-6 px-1.5 rounded-full text-[12px] font-semibold flex items-center justify-center tabular-nums ${
              item.badgeTone === "red" ? "bg-rose-500 text-white" : active ? "bg-white text-blue-600" : "bg-blue-600 text-white"
            }`}
          >
            {item.badge}
          </span>
        ) : active ? (
          <ChevronRight className="h-4 w-4" />
        ) : null}
      </Link>
    );
  };

  const initials = (user.name || "Admin")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const roleLabel = (user.role || "admin").replace("_", " ");

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 flex">
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" aria-hidden="true" />}

      <aside
        className={`fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 w-[272px] bg-[#0b1530] text-white flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-[76px] flex items-center justify-between px-6 border-b border-white/[0.07]">
          <Link href="/admin" className="flex items-center gap-3">
            <svg viewBox="0 0 48 40" className="h-9 w-10" aria-hidden="true">
              <defs>
                <linearGradient id="admin-logo" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#60a5fa" />
                  <stop offset="1" stopColor="#2563eb" />
                </linearGradient>
              </defs>
              <path d="M24 2 L46 38 H35 L24 19 L13 38 H2 Z" fill="url(#admin-logo)" />
              <path d="M17 38 L24 26 L31 38 Z" fill="#93c5fd" opacity="0.6" />
            </svg>
            <span className="leading-tight">
              <span className="block text-[19px] font-bold">Allinonepermium</span>
              <span className="block text-[12px] text-slate-400">Admin Panel</span>
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 text-slate-400 hover:text-white" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Admin">
          <div className="space-y-1">{main.map(navLink)}</div>

          <p className="mt-6 mb-2 px-3.5 text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Store settings</p>
          <div className="space-y-1">
            {navLink({ name: "Settings", href: "/admin/settings", icon: Settings })}
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-3.5 h-11 px-3.5 rounded-xl text-[15px] font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white"
            >
              <ExternalLink className="h-5 w-5" strokeWidth={1.8} />
              <span className="flex-1">View Storefront</span>
            </a>
          </div>

          <p className="mt-6 mb-2 px-3.5 text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Admin tools</p>
          <div className="space-y-1">
            <AdminAppControls />
            <button
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                if (next) playAlertSound();
              }}
              role="switch"
              aria-checked={soundOn}
              className="w-full flex items-center gap-3.5 h-11 px-3.5 rounded-xl text-[15px] font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white"
            >
              <Volume2 className="h-5 w-5" strokeWidth={1.8} />
              <span className="flex-1 text-left">Alarm Sound</span>
              <span className={`h-6 w-11 rounded-full p-0.5 transition-colors ${soundOn ? "bg-blue-600" : "bg-slate-600"}`} aria-hidden="true">
                <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${soundOn ? "translate-x-5" : ""}`} />
              </span>
            </button>
          </div>
        </nav>

        <div className="px-5 py-4 border-t border-white/[0.07] flex items-center gap-3">
          <span className="h-11 w-11 rounded-full bg-blue-600 flex items-center justify-center text-[14px] font-bold">{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold truncate">{user.name || "Administrator"}</p>
            <p className="text-[12px] text-slate-400 truncate capitalize">{roleLabel}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="p-2 rounded-lg text-slate-400 hover:bg-white/[0.08] hover:text-white"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-[76px] bg-white/90 backdrop-blur border-b border-slate-200/70 px-4 sm:px-8 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>

          <form onSubmit={runSearch} className="relative flex-1 max-w-xl" role="search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" aria-hidden="true" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, orders, phone numbers…"
              aria-label="Search the admin"
              className="w-full h-11 rounded-xl bg-slate-100/80 border border-transparent pl-11 pr-20 text-[14px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <kbd className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-500">
              Ctrl + K
            </kbd>
          </form>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin/notifications"
              className="relative h-11 w-11 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            >
              <Bell className="h-[22px] w-[22px]" strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-3 h-12 pl-1 pr-2 rounded-full hover:bg-slate-100"
              >
                <span className="h-10 w-10 rounded-full bg-[#0b1530] text-white flex items-center justify-center text-[13px] font-bold">{initials}</span>
                <span className="hidden md:block text-left leading-tight">
                  <span className="block text-[14px] font-semibold text-slate-900">{user.name || "Administrator"}</span>
                  <span className="block text-[12px] text-slate-500 capitalize">{roleLabel}</span>
                </span>
                <ChevronDown className="hidden md:block h-4 w-4 text-slate-500" />
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 text-[14px]">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">{user.name || "Administrator"}</p>
                    <p className="text-[12px] text-slate-500 truncate">{user.email}</p>
                  </div>
                  <Link role="menuitem" href="/admin/settings" className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50">
                    <Settings className="h-4 w-4 text-slate-400" /> Store settings
                  </Link>
                  <a role="menuitem" href="/" target="_blank" rel="noopener" className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50">
                    <ExternalLink className="h-4 w-4 text-slate-400" /> View storefront
                  </a>
                  <button
                    role="menuitem"
                    onClick={() => signOut({ callbackUrl: "/admin/login" })}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
