import Link from "next/link";
import { Phone, Mail, MapPin, Banknote, Landmark } from "lucide-react";
import { getStorefrontData, BRAND, whatsappHref } from "@/lib/storefront";
import { PaymentMethod } from "@/types";
import Logo from "./Logo";
import BackToTop from "./BackToTop";

const paymentLabels: Record<string, { label: string; icon: typeof Banknote }> = {
  [PaymentMethod.CASH_ON_DELIVERY]: { label: "Cash on Delivery", icon: Banknote },
  bank_transfer: { label: "Bank Transfer", icon: Landmark },
};

const socialIcons: Record<string, React.ReactNode> = {
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

export default async function Footer() {
  const { info } = await getStorefrontData();

  const social = Object.entries(info.socialLinks)
    .map(([key, value]) => ({ key, href: key === "whatsapp" ? whatsappHref(value) : value || "" }))
    .filter((s) => s.href.startsWith("http"));

  const columns = [
    {
      title: "Quick Links",
      links: [
        ["Home", "/"],
        ["Shop", "/shop"],
        ["Categories", "/#categories"],
        ["About Us", "/about"],
        ["Contact", "/contact"],
      ],
    },
    {
      title: "Customer Service",
      links: [
        ["FAQs", "/faq"],
        ["Shipping Policy", "/policies#shipping"],
        ["Return & Exchange", "/policies#returns"],
        ["Privacy Policy", "/policies#privacy"],
      ],
    },
  ];

  return (
    <>
      <footer className="panel-dark text-white/75 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-9 grid grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-10">
          <div className="col-span-2 lg:col-span-4">
            <Logo />
            <p className="mt-5 text-[14px] leading-relaxed max-w-xs text-white/60">
              Phones, audio, wearables, charging essentials and everyday accessories — selected for useful design, reliable quality and delivery across Pakistan.
            </p>
            {social.length > 0 && (
              <ul className="mt-6 flex items-center gap-2.5">
                {social.map((s) => (
                  <li key={s.key}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.key[0].toUpperCase() + s.key.slice(1)}
                      className="h-10 w-10 rounded-[10px] border border-white/15 flex items-center justify-center text-white/80 hover:text-navy-950 hover:bg-gold-300 hover:border-gold-300 transition"
                    >
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
                        {socialIcons[s.key]}
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="lg:col-span-2">
              <h2 className="text-[13px] font-semibold text-white tracking-wide">{col.title}</h2>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="hover:text-gold-300 transition">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <h2 className="text-[13px] font-semibold text-white tracking-wide">Contact Us</h2>
            <ul className="mt-4 space-y-3 text-[14px]">
              {info.contactPhone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 mt-0.5 text-gold-400 shrink-0" aria-hidden="true" />
                  <a href={`tel:${info.contactPhone.replace(/\s/g, "")}`} className="hover:text-gold-300">{info.contactPhone}</a>
                </li>
              )}
              {info.contactEmail && (
                <li className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 mt-0.5 text-gold-400 shrink-0" aria-hidden="true" />
                  <a href={`mailto:${info.contactEmail}`} className="hover:text-gold-300 break-all">{info.contactEmail}</a>
                </li>
              )}
              {info.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 mt-0.5 text-gold-400 shrink-0" aria-hidden="true" />
                  <span>{info.address}</span>
                </li>
              )}
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <h2 className="text-[13px] font-semibold text-white tracking-wide">Payment Methods</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {info.paymentMethods.map((m) => {
                const p = paymentLabels[m] || { label: m.replace(/_/g, " "), icon: Banknote };
                return (
                  <li key={m} className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-[13px] text-white/85">
                    <p.icon className="h-4 w-4 text-gold-400" aria-hidden="true" />
                    {p.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-white/50">
            <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <p className="text-gold-300/80">{BRAND.slogan}</p>
              <BackToTop />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
