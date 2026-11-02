"use client";

import { useEffect, useSyncExternalStore } from "react";
import { BellRing, BellOff, Download } from "lucide-react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// The browser fires `beforeinstallprompt` once, possibly before the sidebar mounts, so keep it at module level.
let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Registers the admin service worker. Rendered once by the admin layout. */
export default function AdminPwa() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as InstallPromptEvent;
      emit();
    };
    const onInstalled = () => {
      deferredPrompt = null;
      emit();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}

/** Shows a system notification for a new order (via the service worker so it works when the app is in the background). */
export async function notifyNewOrder(order: { _id: string; orderNumber: string; total: number; customer?: { name?: string; city?: string } }) {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
  const message = {
    type: "new-order",
    title: `New order request ${order.orderNumber}`,
    body: `Rs. ${order.total.toLocaleString("en-PK")} · ${order.customer?.name ?? "Customer"}${order.customer?.city ? ` (${order.customer.city})` : ""}`,
    tag: `order-${order._id}`,
    url: `/admin/orders?search=${encodeURIComponent(order.orderNumber)}`,
  };
  const reg = await navigator.serviceWorker?.getRegistration("/admin").catch(() => undefined);
  if (reg?.active) {
    reg.active.postMessage(message);
  } else {
    new Notification(message.title, { body: message.body, tag: message.tag, icon: "/admin-icons/icon-192.png" });
  }
}

/** Sidebar controls: install the admin app and turn on order notifications. */
export function AdminAppControls() {
  const canInstall = useSyncExternalStore(subscribe, () => deferredPrompt !== null, () => false);
  const supported = useSyncExternalStore(subscribe, () => "Notification" in window, () => false);
  // Read on the client only (server renders "unknown") so the markup matches during hydration.
  const permission = useSyncExternalStore(subscribe, () => ("Notification" in window ? Notification.permission : "unknown"), () => "unknown");

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    emit();
  }

  async function enableNotifications() {
    const result = await Notification.requestPermission();
    emit();
    if (result === "granted") {
      new Notification("Order notifications are on", {
        body: "You'll be alerted here when a new order request arrives.",
        icon: "/admin-icons/icon-192.png",
      });
    }
  }

  return (
    <>
      {canInstall && (
        <button
          onClick={install}
          className="w-full flex items-center gap-3.5 h-11 px-3.5 rounded-xl text-[15px] font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white"
        >
          <Download className="h-5 w-5" strokeWidth={1.8} /> Install Admin App
        </button>
      )}
      {supported && permission !== "granted" && (
        <button
          onClick={enableNotifications}
          disabled={permission === "denied"}
          title={permission === "denied" ? "Notifications are blocked. Allow them in your browser's site settings." : undefined}
          className="w-full flex items-center gap-3.5 h-11 px-3.5 rounded-xl text-[15px] font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
        >
          {permission === "denied" ? <BellOff className="h-5 w-5" strokeWidth={1.8} /> : <BellRing className="h-5 w-5" strokeWidth={1.8} />}
          {permission === "denied" ? "Notifications blocked" : "Enable Order Alerts"}
        </button>
      )}
    </>
  );
}
