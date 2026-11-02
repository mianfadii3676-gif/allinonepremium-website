import type { Metadata, Viewport } from "next";
import { Archivo, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import ToastContainer from "@/components/ui/Toast";
import "./globals.css";

// Archivo for headings: tight, sturdy retail type. Hanken Grotesk for body: warm and very readable at small sizes.
const display = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "allinonepermium — Everything You Need, One Place",
    template: "%s | allinonepermium",
  },
  description:
    "Shop premium mobiles, audio, smartwatches, accessories, home essentials and more at allinonepermium. Delivery across Pakistan with cash on delivery.",
  applicationName: "allinonepermium",
  openGraph: {
    type: "website",
    siteName: "allinonepermium",
    title: "allinonepermium — Everything You Need, One Place",
    description: "Premium products for a better you. Shop smarter, live better.",
    locale: "en_PK",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a1640",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} scroll-smooth`}>
      <body className="min-h-screen flex flex-col bg-paper text-ink antialiased" suppressHydrationWarning>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-gold-300 focus:px-4 focus:py-2 focus:text-navy-950 focus:font-semibold">
          Skip to content
        </a>
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
