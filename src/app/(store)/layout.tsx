import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";

/** Storefront chrome. The admin panel lives outside this group and has its own layout. */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
