import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import AdminPwa from "@/components/admin/AdminPwa";

const adminFont = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

// Shared by the login page and the protected panel: makes /admin a separate installable app.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Allinonepermium Admin" },
  manifest: "/admin.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "AOP Admin", statusBarStyle: "black-translucent" },
  icons: { apple: "/admin-icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#070b16",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`admin-root ${adminFont.className} antialiased`}>
      <AdminPwa />
      {children}
    </div>
  );
}
