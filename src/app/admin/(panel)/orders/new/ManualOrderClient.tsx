"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Minus, Plus, Search, Trash2, PackageOpen } from "lucide-react";
import { toast } from "@/lib/store/toastStore";
import { OrderStatus, type IProduct } from "@/types";

type Line = { product: IProduct; variant: string; quantity: number; unitPrice: string };

const inputCls =
  "w-full h-9 rounded-md bg-white border border-slate-300 px-3 text-[13px] text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const labelCls = "block text-[13px] font-medium text-slate-700 mb-1";

const customerFields = [
  { key: "name", label: "Full name", type: "text", required: true },
  { key: "phone", label: "Phone", type: "tel", required: true },
  { key: "city", label: "City", type: "text", required: true },
  { key: "email", label: "Email (optional)", type: "email", required: false },
] as const;

/** Phone/WhatsApp orders entered by staff. They are approved on creation and get an official order ID. */
export default function ManualOrderClient() {
  const router = useRouter();
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", city: "", address: "", notes: "" });
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [discount, setDiscount] = useState("");
  const [status, setStatus] = useState<OrderStatus>(OrderStatus.CONFIRMED);
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/products?search=${encodeURIComponent(term)}&limit=8`, { signal: controller.signal });
        const data = await res.json();
        setResults(data.products || []);
      } catch {
        // aborted or offline
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  const showResults = query.trim().length >= 2;

  function addProduct(p: IProduct) {
    setLines((prev) => {
      const variant = p.variants?.[0]?.value || "";
      const i = prev.findIndex((l) => l.product._id === p._id && l.variant === variant);
      if (i > -1) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: Math.min(p.stock, next[i].quantity + 1) };
        return next;
      }
      return [...prev, { product: p, variant, quantity: 1, unitPrice: "" }];
    });
    setQuery("");
    setResults([]);
  }

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  // Preview only; the server recalculates every amount from the database.
  const preview = useMemo(() => {
    const subtotal = lines.reduce((sum, l) => {
      const v = l.product.variants?.find((x) => x.value === l.variant);
      const price = l.unitPrice !== "" ? Number(l.unitPrice) || 0 : l.product.price + (v?.priceModifier || 0);
      return sum + price * l.quantity;
    }, 0);
    const delivery = Number(deliveryCharge) || 0;
    const disc = Number(discount) || 0;
    return { subtotal, delivery, disc, total: Math.max(0, subtotal + delivery - disc) };
  }, [lines, deliveryCharge, discount]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return; // guard against double submission
    if (lines.length === 0) {
      toast.error("No items", "Add at least one product to the order.");
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: lines.map((l) => ({
            productId: l.product._id,
            quantity: l.quantity,
            variant: l.variant || undefined,
            unitPrice: l.unitPrice,
          })),
          deliveryCharge: deliveryCharge === "" ? undefined : Number(deliveryCharge),
          discount: discount === "" ? undefined : Number(discount),
          status,
          adminNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not create the order.");
      toast.success("Order created", `Order ${data.order.orderNumber} has been created.`);
      router.push(`/admin/orders?search=${encodeURIComponent(data.order.orderNumber)}`);
      router.refresh();
    } catch (err) {
      toast.error("Order not created", (err as Error).message);
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Orders
        </Link>
        <h2 className="text-xl font-semibold text-slate-900 mt-1">New manual order</h2>
        <p className="text-sm text-slate-500">For phone, WhatsApp or walk-in orders. The order ID is assigned immediately.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5">
            <h2 className="text-[14px] font-semibold text-slate-900 mb-4">Customer</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {customerFields.map((f) => (
                <div key={f.key}>
                  <label htmlFor={`c-${f.key}`} className={labelCls}>{f.label}</label>
                  <input
                    id={`c-${f.key}`}
                    required={f.required}
                    type={f.type}
                    value={customer[f.key]}
                    onChange={(e) => setCustomer({ ...customer, [f.key]: e.target.value })}
                    className={inputCls}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label htmlFor="c-address" className={labelCls}>Delivery address</label>
                <textarea
                  id="c-address"
                  required
                  rows={2}
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  className={`${inputCls} h-auto py-2`}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-notes" className={labelCls}>Customer note (optional)</label>
                <input id="c-notes" value={customer.notes} onChange={(e) => setCustomer({ ...customer, notes: e.target.value })} className={inputCls} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5">
            <h2 className="text-[14px] font-semibold text-slate-900 mb-4">Items</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products by name or SKU…"
                aria-label="Search products"
                className={`${inputCls} pl-9`}
              />
              {showResults && (
                <div className="absolute z-20 mt-1 w-full rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] shadow-2xl max-h-80 overflow-y-auto">
                  {searching && results.length === 0 ? (
                    <p className="p-3 text-sm text-slate-500 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                    </p>
                  ) : results.length === 0 ? (
                    <p className="p-3 text-sm text-slate-500">No products found.</p>
                  ) : (
                    results.map((p) => (
                      <button
                        type="button"
                        key={p._id}
                        disabled={p.stock <= 0}
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm text-slate-900 truncate">{p.name}</span>
                          <span className="block text-[11px] text-slate-500 font-mono">
                            {p.sku} · {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                          </span>
                        </span>
                        <span className="text-sm text-slate-900 tabular-nums shrink-0">Rs. {p.price.toLocaleString("en-PK")}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {lines.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-slate-200 py-10 text-center text-slate-500">
                <PackageOpen className="h-7 w-7 mx-auto" />
                <p className="mt-2 text-sm">Search above to add products.</p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-slate-200">
                {lines.map((l, i) => (
                  <li key={`${l.product._id}-${l.variant}`} className="py-3 grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-12 sm:col-span-5 min-w-0">
                      <p className="text-sm text-slate-900 truncate">{l.product.name}</p>
                      {l.product.variants?.length > 0 ? (
                        <select
                          aria-label="Variant"
                          value={l.variant}
                          onChange={(e) => updateLine(i, { variant: e.target.value })}
                          className="mt-1 h-8 rounded-md bg-slate-50 border border-slate-200 px-2 text-[12px] text-slate-900"
                        >
                          {l.product.variants.map((v) => (
                            <option key={v.value} value={v.value}>
                              {v.name}: {v.value}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[11px] text-slate-500 font-mono">{l.product.sku}</p>
                      )}
                    </div>
                    <div className="col-span-5 sm:col-span-3 flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => updateLine(i, { quantity: Math.max(1, l.quantity - 1) })}
                        className="h-8 w-8 rounded-md bg-slate-100 text-slate-900 flex items-center justify-center"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">{l.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={l.quantity >= l.product.stock}
                        onClick={() => updateLine(i, { quantity: l.quantity + 1 })}
                        className="h-8 w-8 rounded-md bg-slate-100 text-slate-900 flex items-center justify-center disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <input
                        type="number"
                        min={0}
                        aria-label="Unit price override"
                        placeholder={`Rs. ${l.product.price}`}
                        value={l.unitPrice}
                        onChange={(e) => updateLine(i, { unitPrice: e.target.value })}
                        className="w-full h-8 rounded-md bg-white border border-slate-300 px-2 text-[13px] text-slate-900 tabular-nums"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => setLines(lines.filter((_, idx) => idx !== i))}
                      className="col-span-2 sm:col-span-1 justify-self-end p-2 text-slate-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-slate-500">
              Leave the price empty to use the catalogue price. Stock is reserved when the order is created.
            </p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 space-y-4">
            <h2 className="text-[14px] font-semibold text-slate-900">Order details</h2>
            <div>
              <label htmlFor="o-status" className={labelCls}>Initial status</label>
              <select id="o-status" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className={inputCls}>
                <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                <option value={OrderStatus.PROCESSING}>Processing</option>
                <option value={OrderStatus.SHIPPED}>Shipped</option>
                <option value={OrderStatus.DELIVERED}>Delivered</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="o-delivery" className={labelCls}>Delivery (Rs.)</label>
                <input id="o-delivery" type="number" min={0} placeholder="Default" value={deliveryCharge} onChange={(e) => setDeliveryCharge(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="o-discount" className={labelCls}>Discount (Rs.)</label>
                <input id="o-discount" type="number" min={0} placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label htmlFor="o-notes" className={labelCls}>Internal note</label>
              <textarea
                id="o-notes"
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className={`${inputCls} h-auto py-2`}
                placeholder="e.g. Ordered via WhatsApp"
              />
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">Rs. {preview.subtotal.toLocaleString("en-PK")}</dd>
              </div>
              <div className="flex justify-between text-slate-500">
                <dt>Delivery</dt>
                <dd className="tabular-nums">{deliveryCharge === "" ? "Store default" : `Rs. ${preview.delivery.toLocaleString("en-PK")}`}</dd>
              </div>
              <div className="flex justify-between text-slate-500">
                <dt>Discount</dt>
                <dd className="tabular-nums">− Rs. {preview.disc.toLocaleString("en-PK")}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-slate-900 font-semibold">
                <dt>Estimated total</dt>
                <dd className="tabular-nums">Rs. {preview.total.toLocaleString("en-PK")}</dd>
              </div>
            </dl>
            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full h-9 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create order
            </button>
            <p className="mt-2 text-[11px] text-slate-500 text-center">Final amounts are calculated by the server.</p>
          </section>
        </aside>
      </div>
    </form>
  );
}
