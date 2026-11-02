import Link from "next/link";
import { BRAND } from "@/lib/brand";

/** Blue "A" monogram + italic wordmark. `tone` controls wordmark colour for dark/light backgrounds. */
export default function Logo({ tone = "light", showTagline = true }: { tone?: "light" | "dark"; showTagline?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0" aria-label={`${BRAND.name} home`}>
      <svg viewBox="0 0 48 40" className="h-10 w-12" aria-hidden="true">
        <defs>
          <linearGradient id="logo-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4b8bff" />
            <stop offset="1" stopColor="#1653d6" />
          </linearGradient>
        </defs>
        <path d="M24 2 L46 38 H35 L24 19 L13 38 H2 Z" fill="url(#logo-blue)" />
        <path d="M17 38 L24 26 L31 38 Z" fill={tone === "light" ? "#ffffff" : "#0a1640"} />
      </svg>
      <span className="flex flex-col leading-none">
        <span className={`wordmark text-[22px] sm:text-[24px] ${tone === "light" ? "text-white" : "text-ink"}`}>
          allinone<span className={tone === "light" ? "text-navy-600" : "text-navy-700"}>permium</span>
        </span>
        {showTagline && (
          <span className={`text-[11px] font-medium mt-1 pl-0.5 ${tone === "light" ? "text-white/70" : "text-ink-soft"}`}>{BRAND.slogan}</span>
        )}
      </span>
    </Link>
  );
}
