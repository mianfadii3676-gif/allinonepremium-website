"use client";

import { Bell as HeaderIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  ShoppingBag,
  AlertTriangle,
  XCircle,
  Info,
} from "lucide-react";
import { toast } from "@/lib/store/toastStore";
import { INotification, NotificationType } from "@/types";

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: INotification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/admin/notifications", { method: "PATCH" });
      if (res.ok) {
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
        toast.success("All Read", "All notifications marked as read.");
      }
    } catch {
      toast.error("Error", "Could not update notifications.");
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: "PATCH" });
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications(notifications.filter((n) => n._id !== id));
        toast.info("Notification Removed");
      }
    } catch {
      toast.error("Error", "Could not delete notification.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex h-16 w-16 shrink-0 rounded-2xl bg-blue-50 text-blue-600 items-center justify-center">
            <HeaderIcon className="h-8 w-8" strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-[12px] font-semibold tracking-wide text-blue-600 uppercase">Notifications</p>
            <h1 className="text-[26px] sm:text-[30px] leading-tight font-bold text-slate-900">Notification Center</h1>
            <p className="mt-0.5 text-[14px] text-slate-500">System events, new orders, cancellation alerts, and inventory warnings.</p>
          </div>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-900 border border-slate-200 transition flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4 text-blue-700" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden shadow-sm divide-y divide-slate-200">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No notifications in the system yet.
          </div>
        ) : (
          notifications.map((n) => {
            const Icon =
              n.type === NotificationType.NEW_ORDER
                ? ShoppingBag
                : n.type === NotificationType.ORDER_CANCELLED
                ? XCircle
                : n.type === NotificationType.LOW_STOCK
                ? AlertTriangle
                : Info;

            const iconColors =
              n.type === NotificationType.NEW_ORDER
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : n.type === NotificationType.ORDER_CANCELLED
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-amber-50 text-amber-700 border-amber-200";

            return (
              <div
                key={n._id}
                onClick={() => handleMarkSingleRead(n._id!)}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition ${
                  n.isRead ? "bg-transparent opacity-75" : "bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${iconColors}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-slate-900 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-500 tabular-nums">
                      {new Date(n.createdAt!).toLocaleString("en-PK")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.link && (
                    <Link
                      href={n.link}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition"
                      title="Open Related Record"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n._id!);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-slate-100 transition"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
