"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";
import { toast } from "@/lib/store/toastStore";
import type { IStoreSettings } from "@/types";
import {
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  ShoppingBag,
  Banknote,
} from "lucide-react";

export default function CheckoutPage() {
  const [settings, setSettings] = useState({ deliveryCharge: 200, freeDeliveryThreshold: 3000, contactPhone: "" });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/settings", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load delivery settings");
        return response.json() as Promise<{ settings?: IStoreSettings }>;
      })
      .then(({ settings: saved }) => {
        if (!saved) return;
        setSettings({
          deliveryCharge: saved.deliveryCharge ?? 200,
          freeDeliveryThreshold: saved.freeDeliveryThreshold ?? 3000,
          contactPhone: saved.contactPhone || "",
        });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") console.error(error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSettingsLoaded(true);
      });
    return () => controller.abort();
  }, []);

  if (!settingsLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14" aria-busy="true">
        <p className="text-sm text-ink-faint">Loading checkout…</p>
      </div>
    );
  }

  return <CheckoutContent settings={settings} />;
}

function CheckoutContent({ settings }: { settings: { deliveryCharge: number; freeDeliveryThreshold: number; contactPhone: string } }) {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const subtotal = getSubtotal();
  const freeThreshold = settings.freeDeliveryThreshold;
  const deliveryCharge = subtotal === 0 || (freeThreshold > 0 && subtotal >= freeThreshold) ? 0 : settings.deliveryCharge;
  const grandTotal = subtotal + deliveryCharge;

  const popularCities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Sialkot"];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage("");
  };

  const handleCitySelect = (cityName: string) => {
    setForm({ ...form, city: cityName });
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (items.length === 0) {
      setErrorMessage("Your bag is empty. Add items before placing an order.");
      toast.error("Bag is empty", "Add products to continue.");
      return;
    }

    if (!form.name.trim() || !form.phone.trim() || !form.city.trim() || !form.address.trim()) {
      setErrorMessage("Please fill in your name, phone number, delivery city, and full street address.");
      toast.error("Incomplete address", "Please fill in all required shipping fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          city: form.city.trim(),
          address: form.address.trim(),
          notes: form.notes.trim() || undefined,
        },
        items: items.map((it) => ({
          productId: it.product._id,
          productName: it.product.name,
          sku: it.product.sku,
          variant: it.variant?.value,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          subtotal: it.subtotal,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to process your order. Please try again.");
      }

      clearCart();
      toast.success("Order placed", `Order #${data.order.orderNumber} is confirmed.`);
      router.push(`/order-success/${data.order.orderNumber}?t=${encodeURIComponent(data.order.accessToken)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not complete your order. Please check your details and try again.";
      setErrorMessage(msg);
      toast.error("Order failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-paper-deep flex items-center justify-center mx-auto mb-5 text-ink-faint">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl text-ink">Your bag is empty</h1>
        <p className="text-ink-faint mt-2 max-w-sm mx-auto text-[15px]">
          There is nothing here to check out yet.
        </p>
        <Link
          href="/shop"
          className="btn-ink mt-7 inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Browse the catalogue</span>
        </Link>
      </div>
    );
  }

  const inputCls =
    "w-full bg-white border border-line rounded-[10px] px-4 py-3 text-[15px] text-ink placeholder-ink-faint focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm text-ink-faint hover:text-ink transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to shopping</span>
      </Link>
      <h1 className="font-display text-4xl sm:text-5xl text-ink tracking-tight mt-3">
        Checkout
      </h1>
      <p className="text-ink-soft mt-2">
        Pay cash when the parcel arrives. No card needed.
        {settings.freeDeliveryThreshold > 0 && (
          <> {settings.freeDeliveryThreshold.toLocaleString("en-PK")} or more ships free.</>
        )}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-10">
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmitOrder} className="space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3" role="alert">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="bg-white border border-line-soft rounded-2xl p-6 sm:p-8 paper-card">
              <h2 className="font-display text-xl text-ink pb-4 border-b border-line-soft">
                Where should the rider go?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="co-name" className="text-sm font-medium text-ink">
                    Full name <span aria-hidden="true" className="text-gold-600">*</span>
                  </label>
                  <input
                    id="co-name"
                    type="text"
                    name="name"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Muhammad Ali"
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="co-phone" className="text-sm font-medium text-ink">
                    Mobile number <span aria-hidden="true" className="text-gold-600">*</span>
                  </label>
                  <input
                    id="co-phone"
                    type="tel"
                    name="phone"
                    required
                    autoComplete="tel"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. 0300 1234567"
                    className={inputCls}
                  />
                  <p className="text-xs text-ink-faint">The rider calls this number before arrival.</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="co-email" className="text-sm font-medium text-ink">
                    Email <span className="text-ink-faint font-normal">(optional)</span>
                  </label>
                  <input
                    id="co-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="ali@example.com"
                    className={inputCls}
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="co-city" className="text-sm font-medium text-ink">
                    City <span aria-hidden="true" className="text-gold-600">*</span>
                  </label>
                  <input
                    id="co-city"
                    type="text"
                    name="city"
                    required
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Lahore, Karachi, Islamabad…"
                    className={inputCls}
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {popularCities.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => handleCitySelect(c)}
                        className={`px-3 py-1.5 rounded-full text-[13px] transition ${
                          form.city.toLowerCase() === c.toLowerCase()
                            ? "bg-ink text-white"
                            : "border border-line text-ink-soft hover:border-ink hover:text-ink"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="co-address" className="text-sm font-medium text-ink">
                    Street address <span aria-hidden="true" className="text-gold-600">*</span>
                  </label>
                  <textarea
                    id="co-address"
                    name="address"
                    required
                    rows={3}
                    autoComplete="street-address"
                    value={form.address}
                    onChange={handleInputChange}
                    placeholder="House / street / sector / landmark"
                    className={`${inputCls} leading-relaxed`}
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="co-notes" className="text-sm font-medium text-ink">
                    Delivery notes <span className="text-ink-faint font-normal">(optional)</span>
                  </label>
                  <input
                    id="co-notes"
                    type="text"
                    name="notes"
                    value={form.notes}
                    onChange={handleInputChange}
                    placeholder="e.g. Deliver after 3pm"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-navy-700/5 border border-navy-700/15 flex items-start gap-4">
              <span className="h-10 w-10 rounded-full bg-navy-700 text-white flex items-center justify-center shrink-0">
                <Banknote className="h-5 w-5" />
              </span>
              <p className="text-sm text-ink leading-relaxed">
                <span className="font-medium">Cash on delivery.</span>{" "}
                <span className="text-ink-soft">
                  Pay <span className="font-semibold text-ink tabular-nums">Rs. {grandTotal.toLocaleString()}</span> to
                  the courier when the parcel arrives.
                </span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-ink w-full py-4 px-8 rounded-full font-medium text-base disabled:opacity-50"
            >
              {isSubmitting ? "Placing your order…" : `Confirm order — Rs. ${grandTotal.toLocaleString()}`}
            </button>
          </form>
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28 bg-white border border-line-soft rounded-2xl p-6 sm:p-7 paper-card">
            <h2 className="font-display text-xl text-ink pb-4 border-b border-line-soft">
              Order summary
            </h2>

            <div className="max-h-80 overflow-y-auto divide-y divide-line-soft -mx-1 px-1">
              {items.map((it, idx) => (
                <div key={idx} className="py-3.5 flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-paper-deep border border-line-soft shrink-0">
                    <Image
                      src={it.product.images?.[0]?.url || "/placeholder.svg"}
                      alt={it.product.name}
                      fill
                      sizes="60px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-ink truncate">{it.product.name}</h4>
                    {it.variant && (
                      <p className="text-xs text-ink-faint">{it.variant.value}</p>
                    )}
                    <p className="text-xs text-ink-faint tabular-nums">
                      {it.quantity} × Rs. {it.unitPrice.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink tabular-nums">
                    Rs. {it.subtotal.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <dl className="space-y-2.5 pt-4 border-t border-line-soft text-[15px]">
              <div className="flex justify-between">
                <dt className="text-ink-faint">Subtotal</dt>
                <dd className="text-ink font-medium tabular-nums">Rs. {subtotal.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-faint">Delivery</dt>
                <dd className="text-navy-700 font-medium">
                  {deliveryCharge === 0 ? "Free" : `Rs. ${deliveryCharge}`}
                </dd>
              </div>
              <div className="pt-3 border-t border-line-soft flex justify-between items-baseline">
                <dt className="font-medium text-ink">Due on delivery</dt>
                <dd className="font-display text-2xl text-ink tabular-nums">
                  Rs. {grandTotal.toLocaleString()}
                </dd>
              </div>
            </dl>

            <p className="pt-4 mt-2 border-t border-line-soft flex items-center gap-2 text-[13px] text-ink-faint">
              <ShieldCheck className="h-4 w-4 text-navy-700 shrink-0" />
              <span>Tracked delivery · 7-day replacement</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
