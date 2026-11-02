"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";

export default function CartDrawer() {
  const [settings, setSettings] = useState({ deliveryCharge: 200, freeDeliveryThreshold: 3000 });
  const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal } = useCartStore();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/settings", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Settings unavailable"))))
      .then((data: { settings?: { deliveryCharge?: number; freeDeliveryThreshold?: number } }) => {
        if (data.settings) {
          setSettings({
            deliveryCharge: data.settings.deliveryCharge ?? 200,
            freeDeliveryThreshold: data.settings.freeDeliveryThreshold ?? 3000,
          });
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeCart]);

  const subtotal = getSubtotal();
  const freeThreshold = settings.freeDeliveryThreshold;
  const remainingForFree = freeThreshold > 0 ? Math.max(0, freeThreshold - subtotal) : 0;
  const progressPercent = freeThreshold > 0 ? Math.min(100, Math.round((subtotal / freeThreshold) * 100)) : 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="presentation">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCart}
            className="fixed inset-0 bg-night/50 backdrop-blur-[2px] transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-screen max-w-md bg-paper text-ink flex flex-col shadow-2xl border-l border-line-soft"
              role="dialog"
              aria-label="Shopping bag"
              aria-modal="true"
              aria-labelledby="cart-drawer-title"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-line-soft">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="h-5 w-5 text-navy-700" />
                  <h2 id="cart-drawer-title" className="font-display text-xl">Your bag</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-[10px] bg-paper-deep text-navy-700 tabular-nums">
                    {items.reduce((s, it) => s + it.quantity, 0)}
                  </span>
                </div>
                <button
                  onClick={closeCart}
                  className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-paper-deep transition"
                  aria-label="Close bag"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-white px-6 py-3.5 border-b border-line-soft">
                <p className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                  <Truck className="h-4 w-4 text-navy-700" />
                  {freeThreshold > 0 ? remainingForFree > 0 ? (
                    <span>
                      <span className="font-semibold text-ink tabular-nums">Rs. {remainingForFree.toLocaleString()}</span>
                      {" "}away from free delivery
                    </span>
                  ) : (
                    <span className="font-medium text-navy-700">Free delivery unlocked</span>
                  ) : (
                    <span>Delivery {settings.deliveryCharge > 0 ? `is Rs. ${settings.deliveryCharge.toLocaleString()}` : "charge shown at checkout"}</span>
                  )}
                </p>
                <div className="w-full h-1.5 bg-line-soft rounded-[10px] overflow-hidden mt-2" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                <div
                    className="h-full bg-navy-700 rounded-[10px] transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-line-soft">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-[10px] bg-paper-deep flex items-center justify-center mb-4 text-ink-faint">
                      <ShoppingBag className="h-7 w-7" />
                    </div>
                    <p className="font-display text-xl text-ink">Your bag is empty</p>
                    <p className="text-sm text-ink-faint mt-1 max-w-xs">
                      Chargers, earbuds, power banks and watches are waiting.
                    </p>
                    <Link
                      href="/shop"
                      onClick={closeCart}
                      className="btn-ink mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-sm font-medium"
                    >
                      Browse the catalogue <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  items.map((item) => {
                    const imgUrl = item.product.images?.[0]?.url || "/placeholder.svg";
                    const variantVal = item.variant?.value || "";

                    return (
                      <div key={`${item.product._id}-${variantVal}`} className="py-4 flex gap-4">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-paper-deep shrink-0 border border-line-soft">
                          <Image
                            src={imgUrl}
                            alt={item.product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/products/${item.product.slug}`}
                                onClick={closeCart}
                                className="text-[15px] font-medium text-ink hover:underline underline-offset-4 truncate"
                              >
                                {item.product.name}
                              </Link>
                              <button
                                onClick={() => removeItem(item.product._id!, variantVal)}
                                className="text-ink-faint hover:text-navy-700 transition p-0.5"
                                title="Remove item"
                                aria-label={`Remove ${item.product.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            {item.variant && (
                              <p className="text-[13px] text-ink-faint mt-0.5">{item.variant.value}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-line rounded-[10px] overflow-hidden bg-white">
                              <button
                                onClick={() =>
                                  updateQuantity(item.product._id!, variantVal, item.quantity - 1)
                                }
                                className="px-2.5 py-1.5 text-ink-faint hover:text-ink transition"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-1.5 text-[13px] font-semibold text-ink tabular-nums" aria-live="polite">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.product._id!, variantVal, item.quantity + 1)
                                }
                                className="px-2.5 py-1.5 text-ink-faint hover:text-ink transition"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <span className="text-[15px] font-semibold text-ink tabular-nums">
                              Rs. {item.subtotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

                {items.length > 0 && (
                  <div className="p-6 border-t border-line-soft bg-white space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-ink-faint">Subtotal</span>
                    <span className="text-lg font-semibold text-ink tabular-nums">
                      Rs. {subtotal.toLocaleString()}
                    </span>
                  </div>

                  <p className="flex items-center gap-2 text-[13px] text-ink-faint">
                    <ShieldCheck className="h-4 w-4 text-navy-700 shrink-0" />
                    <span>Cash on delivery · 7-day replacement</span>
                  </p>

                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="btn-ink w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-[10px] font-medium text-[15px]"
                  >
                    <span>Checkout — pay on delivery</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
