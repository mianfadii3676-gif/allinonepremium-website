import {
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Plug,
  House,
  Shirt,
  Sparkles,
  BatteryCharging,
  Cable,
  Speaker,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

// Matched against the category slug so admins don't have to pick icons manually.
const rules: [RegExp, LucideIcon][] = [
  [/mobile|phone|tablet/, Smartphone],
  [/laptop|computer/, Laptop],
  [/audio|headphone|earbud/, Headphones],
  [/watch|wearable/, Watch],
  [/power-?bank|battery/, BatteryCharging],
  [/charger|adapter/, Plug],
  [/cable|protection|case/, Cable],
  [/speaker/, Speaker],
  [/home|living/, House],
  [/fashion|lifestyle|cloth/, Shirt],
  [/beauty|personal|care/, Sparkles],
  [/accessor/, Plug],
];

export default function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = rules.find(([re]) => re.test(slug))?.[1] ?? ShoppingBag;
  return <Icon className={className} strokeWidth={1.6} aria-hidden="true" />;
}
