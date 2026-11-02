import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

/** Shared admin building blocks so every page has the same header, stat cards and pills. */

const tones = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
  orange: "bg-orange-50 text-orange-500",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
} as const;
export type Tone = keyof typeof tones;

export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <span className="hidden sm:flex h-16 w-16 shrink-0 rounded-2xl bg-blue-50 text-blue-600 items-center justify-center">
          <Icon className="h-8 w-8" strokeWidth={1.6} />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-wide text-blue-600 uppercase">{eyebrow}</p>
          <h1 className="text-[26px] sm:text-[30px] leading-tight font-bold text-slate-900">{title}</h1>
          {description && <p className="mt-0.5 text-[14px] text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  tone = "blue",
  label,
  value,
  trend,
  note,
}: {
  icon: LucideIcon;
  tone?: Tone;
  label: string;
  value: React.ReactNode;
  /** Positive change worth highlighting, e.g. "+2 this week". Only pass real figures. */
  trend?: string;
  note?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 flex items-center gap-4">
      <span className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center ${tones[tone]}`}>
        <Icon className="h-7 w-7" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <p className="text-[24px] leading-tight font-bold text-slate-900 tabular-nums">{value}</p>
        {trend ? (
          <p className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" /> {trend}
          </p>
        ) : note ? (
          <p className="mt-0.5 text-[12px] text-slate-500">{note}</p>
        ) : null}
      </div>
    </div>
  );
}

const pillTones = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-600",
} as const;
const dotTones = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  slate: "bg-slate-400",
} as const;

export function StatusPill({ tone, children }: { tone: keyof typeof pillTones; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-semibold ${pillTones[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotTones[tone]}`} aria-hidden="true" />
      {children}
    </span>
  );
}

export const adminInput =
  "h-10 rounded-xl bg-white border border-slate-200 px-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold shadow-[0_6px_16px_-6px_rgba(37,99,235,0.6)] transition-colors disabled:opacity-60";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[14px] font-semibold transition-colors";
