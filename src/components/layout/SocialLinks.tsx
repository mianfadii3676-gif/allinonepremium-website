import { whatsappHref } from "@/lib/storefront";

const icons: Record<string, React.ReactNode> = {
  facebook: <path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6Z" />,
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.1" />
    </>
  ),
  twitter: <path d="M4 4h4.6l4 5.6L17.4 4H20l-6.2 7.1L20.5 20h-4.6l-4.3-6-5.2 6H3.8l6.6-7.6Z" />,
  whatsapp: (
    <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Zm4.8 12.6c-.2.6-1.2 1.1-1.7 1.2-.5 0-1 .2-3.2-.7-2.7-1.1-4.3-3.8-4.5-4-.1-.2-1-1.4-1-2.7s.7-1.9.9-2.2c.3-.3.6-.3.7-.3h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.2 1.3Z" />
  ),
};

/** Brand colour per network, used for the filled round buttons. */
const tint: Record<string, string> = {
  facebook: "bg-[#1877f2]",
  instagram: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]",
  twitter: "bg-black",
  whatsapp: "bg-[#25d366]",
};

export function socialFrom(links: Record<string, string>) {
  return Object.entries(links)
    .map(([key, value]) => ({ key, href: key === "whatsapp" ? whatsappHref(value) : value || "" }))
    .filter((s) => s.href.startsWith("http") && icons[s.key]);
}

/** Round, brand-coloured social buttons. Renders nothing when no links are configured. */
export default function SocialLinks({ links, size = "md" }: { links: { key: string; href: string }[]; size?: "sm" | "md" }) {
  if (links.length === 0) return null;
  const box = size === "sm" ? "h-6 w-6" : "h-9 w-9";
  const glyph = size === "sm" ? "h-3.5 w-3.5" : "h-[18px] w-[18px]";
  return (
    <ul className="flex items-center gap-2">
      {links.map((s) => (
        <li key={s.key}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.key[0].toUpperCase() + s.key.slice(1)}
            className={`${box} ${tint[s.key]} rounded-full flex items-center justify-center text-white transition hover:scale-110`}
          >
            <svg viewBox="0 0 24 24" className={glyph} fill="currentColor" aria-hidden="true">
              {icons[s.key]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
