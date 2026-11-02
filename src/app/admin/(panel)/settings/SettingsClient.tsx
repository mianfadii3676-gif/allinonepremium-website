"use client";

import { Settings as HeaderIcon } from "lucide-react";
import { useState } from "react";
import { Settings, Save, Store, Truck, ShieldAlert, Phone, HelpCircle } from "lucide-react";
import { toast } from "@/lib/store/toastStore";
import { IStoreSettings } from "@/types";

export default function SettingsClient({
  initialSettings,
}: {
  initialSettings: IStoreSettings;
}) {
  const [form, setForm] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update settings");
      }

      toast.success("Settings Saved", "Store settings and delivery rules updated.");
    } catch (err: any) {
      toast.error("Save Error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <span className="hidden sm:flex h-16 w-16 shrink-0 rounded-2xl bg-blue-50 text-blue-600 items-center justify-center">
          <HeaderIcon className="h-8 w-8" strokeWidth={1.6} />
        </span>
        <div>
          <p className="text-[12px] font-semibold tracking-wide text-blue-600 uppercase">Settings</p>
          <h1 className="text-[26px] sm:text-[30px] leading-tight font-bold text-slate-900">Store Configuration & Settings</h1>
          <p className="mt-0.5 text-[14px] text-slate-500">Delivery thresholds, contact channels, Lahore warehouse address, and customer policies.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 text-xs">
        {/* Store Profile */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 text-blue-700 font-bold tabular-nums">
            <Store className="h-5 w-5" />
            <span>Store Profile & Identity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Store Name</label>
              <input
                type="text"
                required
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Tagline / Slogan</label>
              <input
                type="text"
                value={form.tagline || ""}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Support Email</label>
              <input
                type="email"
                value={form.contactEmail || ""}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Support Phone / WhatsApp</label>
              <input
                type="text"
                value={form.contactPhone || ""}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 tabular-nums"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700">HQ / Warehouse Street Address</label>
              <input
                type="text"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Fulfillment & Delivery Rules */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 text-emerald-700 font-bold tabular-nums">
            <Truck className="h-5 w-5" />
            <span>Fulfillment & Delivery Charges</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Standard Delivery Fee (PKR)</label>
              <input
                type="number"
                min={0}
                value={form.deliveryCharge}
                onChange={(e) => setForm({ ...form, deliveryCharge: Number(e.target.value) })}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 tabular-nums focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500">Applied on orders below the threshold.</p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Free Delivery Threshold (PKR)</label>
              <input
                type="number"
                min={0}
                value={form.freeDeliveryThreshold || 0}
                onChange={(e) => setForm({ ...form, freeDeliveryThreshold: Number(e.target.value) })}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 tabular-nums focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500">Orders at or above this amount get free delivery.</p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Low Stock Alert Threshold</label>
              <input
                type="number"
                min={1}
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 tabular-nums focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500">Trigger warnings when units reach this count.</p>
            </div>
          </div>
        </div>

        {/* Customer Policies */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 text-purple-700 font-bold tabular-nums">
            <HelpCircle className="h-5 w-5" />
            <span>Store Customer Policies</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Return & Replacement Policy</label>
              <textarea
                rows={2}
                value={form.policies?.returns || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    policies: { ...form.policies, returns: e.target.value },
                  })
                }
                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Shipping Terms</label>
              <textarea
                rows={2}
                value={form.policies?.shipping || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    policies: { ...form.policies, shipping: e.target.value },
                  })
                }
                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Saving Settings..." : "Save All Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
