"use client";

import { ShoppingBag as HeaderIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  Printer,
  MessageCircle,
  Truck,
  RotateCcw,
  X,
  CheckCircle2,
  AlertTriangle,
  History,
  Clock,
} from "lucide-react";
import { toast } from "@/lib/store/toastStore";
import { IOrder, OrderStatus } from "@/types";

export default function OrdersClient({
  initialOrders,
  initialSearch = "",
  statusCounts,
}: {
  initialSearch?: string;
  initialOrders: IOrder[];
  statusCounts: Record<string, number>;
}) {
  const [orders, setOrders] = useState<IOrder[]>(initialOrders);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [search, setSearch] = useState(initialSearch);

  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [courierName, setCourierName] = useState("Leopards Courier");
  const [trackingNumber, setTrackingNumber] = useState("");

  const statusOptions: { label: string; value: string; count?: number }[] = [
    { label: "All Orders", value: "all", count: statusCounts.all || orders.length },
    { label: "Pending approval", value: "pending", count: statusCounts.pending || 0 },
    { label: "Confirmed", value: "confirmed", count: statusCounts.confirmed || 0 },
    { label: "Processing", value: "processing", count: statusCounts.processing || 0 },
    { label: "Shipped", value: "shipped", count: statusCounts.shipped || 0 },
    { label: "Delivered", value: "delivered", count: statusCounts.delivered || 0 },
    { label: "Cancelled", value: "cancelled", count: statusCounts.cancelled || 0 },
  ];

  const openOrderDrawer = (ord: IOrder) => {
    setSelectedOrder(ord);
    setStatusNote("");
    setCancellationReason(ord.cancellationReason || "");
    setCourierName(ord.courier || "Leopards Courier");
    setTrackingNumber(ord.trackingNumber || "");
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setIsUpdating(true);

    try {
      const payload: any = {
        status: newStatus,
        note: statusNote || undefined,
        courier: courierName,
        trackingNumber: trackingNumber,
      };

      if (newStatus === OrderStatus.CANCELLED) {
        payload.cancellationReason = cancellationReason || "Customer cancelled order";
      }

      const res = await fetch(`/api/admin/orders/${selectedOrder._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update order status");
      }

      if (selectedOrder.orderNumber.startsWith("REQ-") && !data.order.orderNumber.startsWith("REQ-")) {
        toast.success("Order approved", `Official order ID ${data.order.orderNumber} assigned.`);
      } else {
        toast.success("Order Updated", `Order #${data.order.orderNumber} status changed to ${newStatus}.`);
      }

      // Update state
      setOrders(orders.map((o) => (o._id === selectedOrder._id ? data.order : o)));
      setSelectedOrder(data.order);
      setStatusNote("");
    } catch (err: any) {
      toast.error("Update Error", err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevertRevision = async (index: number) => {
    if (!selectedOrder) return;
    if (!confirm("Revert this order to the selected revision?")) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder._id}/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionIndex: index }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to revert order");

      toast.success("Order Reverted", "Successfully rolled back to prior snapshot.");
      setOrders(orders.map((o) => (o._id === selectedOrder._id ? data.order : o)));
      setSelectedOrder(data.order);
    } catch (err: any) {
      toast.error("Revert Failed", err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === "all" || o.status === selectedStatus;
    const matchesSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.phone.includes(search) ||
      o.customer.city.toLowerCase().includes(search.toLowerCase()) ||
      (o.trackingNumber && o.trackingNumber.includes(search)) ||
      (o.requestRef && o.requestRef.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex h-16 w-16 shrink-0 rounded-2xl bg-blue-50 text-blue-600 items-center justify-center">
            <HeaderIcon className="h-8 w-8" strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-[12px] font-semibold tracking-wide text-blue-600 uppercase">Orders</p>
            <h1 className="text-[26px] sm:text-[30px] leading-tight font-bold text-slate-900">Order Fulfillment Desk</h1>
            <p className="mt-0.5 text-[14px] text-slate-500">Track, verify, dispatch, and manage nationwide Cash on Delivery orders.</p>
          </div>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order #, phone, city..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
        {statusOptions.map((tab) => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums ${
                    isActive ? "bg-white/20 text-slate-900" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 tabular-nums border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">City</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Total (COD)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const statusColors: Record<string, string> = {
                    pending: "bg-amber-50 text-amber-700 border-amber-200",
                    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
                    processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
                    shipped: "bg-cyan-50 text-cyan-700 border-cyan-200",
                    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
                  };

                  return (
                    <tr key={ord._id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 tabular-nums font-bold text-slate-900">
                        {ord.orderNumber}
                        {ord.orderNumber.startsWith("REQ-") && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold align-middle">
                            Needs approval
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{ord.customer.name}</div>
                        <div className="text-[11px] text-slate-500 tabular-nums">{ord.customer.phone}</div>
                      </td>

                      <td className="py-3.5 px-4">{ord.customer.city}</td>

                      <td className="py-3.5 px-4">
                        <span className="tabular-nums text-slate-700">
                          {ord.items.reduce((s, it) => s + it.quantity, 0)} items
                        </span>
                      </td>

                      <td className="py-3.5 px-4 tabular-nums font-bold text-slate-900">
                        Rs. {ord.total.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusColors[ord.status] || "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 tabular-nums text-[11px]">
                        {new Date(ord.createdAt!).toLocaleDateString("en-PK", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/orders/${ord._id}/print`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Print Invoice / Packing Slip"
                          >
                            <Printer className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => openOrderDrawer(ord)}
                            className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-50 font-semibold text-[11px] transition"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail & Management Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white border-l border-slate-200 text-slate-900 flex flex-col shadow-sm">
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold tabular-nums">Order #{selectedOrder.orderNumber}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                      {selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Placed on {new Date(selectedOrder.createdAt!).toLocaleString("en-PK")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/orders/${selectedOrder._id}/print`}
                    target="_blank"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-100 text-slate-700 transition"
                    title="Print Invoice"
                  >
                    <Printer className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                {/* Approval: website orders keep a temporary REQ- number until approved. */}
                {selectedOrder.orderNumber.startsWith("REQ-") && selectedOrder.status === OrderStatus.PENDING && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                    <p className="text-[13px] font-semibold text-amber-700">Awaiting approval</p>
                    <p className="text-slate-700 leading-relaxed">
                      Check stock and call the customer to confirm. Approving assigns the official order ID; rejecting
                      cancels the request and returns the items to stock.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleUpdateStatus(OrderStatus.CONFIRMED)}
                        disabled={isUpdating}
                        className="py-2.5 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-60"
                      >
                        Approve &amp; assign order ID
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Reject this order request? Items will be returned to stock.")) {
                            handleUpdateStatus(OrderStatus.CANCELLED);
                          }
                        }}
                        disabled={isUpdating}
                        className="py-2.5 rounded-xl font-semibold bg-rose-50 text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                      >
                        Reject request
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Transition Control */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="font-bold text-slate-700 tabular-nums">
                    Update Order Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { status: OrderStatus.CONFIRMED, label: "Confirm Order" },
                      { status: OrderStatus.PROCESSING, label: "Processing" },
                      { status: OrderStatus.SHIPPED, label: "Dispatch (Shipped)" },
                      { status: OrderStatus.DELIVERED, label: "Mark Delivered" },
                      { status: OrderStatus.CANCELLED, label: "Cancel Order" },
                    ].map((btn) => (
                      <button
                        key={btn.status}
                        onClick={() => handleUpdateStatus(btn.status)}
                        disabled={isUpdating || selectedOrder.status === btn.status}
                        className={`py-2 px-2.5 rounded-xl font-semibold transition text-center truncate ${
                          selectedOrder.status === btn.status
                            ? "bg-blue-600 text-white opacity-60"
                            : btn.status === OrderStatus.CANCELLED
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-50"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Courier & Tracking Input */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] text-slate-500 font-medium">Courier Partner</label>
                      <input
                        type="text"
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        placeholder="Leopards, TCS, Trax..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 font-medium">Tracking Number</label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g. LP12345678"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 mt-1 tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Optional Note */}
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium">Audit Note (Optional)</label>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="e.g. Confirmed with customer over phone"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 mt-1"
                    />
                  </div>
                </div>

                {/* Customer Details & WhatsApp Quick Link */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 tabular-nums">
                      Customer Info
                    </h3>
                    <a
                      href={`https://wa.me/92${selectedOrder.customer.phone.replace(/^0/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-700 hover:bg-emerald-600/30 transition flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp Customer</span>
                    </a>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <p className="font-bold text-slate-900 text-sm">{selectedOrder.customer.name}</p>
                    <p className="text-slate-500 tabular-nums">Phone: {selectedOrder.customer.phone}</p>
                    {selectedOrder.customer.email && (
                      <p className="text-slate-500">Email: {selectedOrder.customer.email}</p>
                    )}
                    <p className="text-slate-700">
                      City: <strong className="text-slate-900">{selectedOrder.customer.city}</strong>
                    </p>
                    <p className="text-slate-700">
                      Address: <strong className="text-slate-900">{selectedOrder.customer.address}</strong>
                    </p>
                    {selectedOrder.customer.notes && (
                      <p className="pt-1 text-slate-500 italic">Notes: &ldquo;{selectedOrder.customer.notes}&rdquo;</p>
                    )}
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h3 className="font-bold text-slate-900 tabular-nums">
                    Purchased Items
                  </h3>
                  <div className="divide-y divide-slate-200">
                    {selectedOrder.items.map((it: any, i: number) => (
                      <div key={i} className="py-2.5 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-900">{it.productName}</p>
                          {it.variant && <p className="text-[11px] text-slate-500">Variant: {it.variant}</p>}
                          <p className="text-[11px] text-slate-500 tabular-nums">
                            {it.quantity} × Rs. {it.unitPrice.toLocaleString()}
                          </p>
                        </div>
                        <span className="tabular-nums font-bold text-slate-900">
                          Rs. {it.subtotal.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-1.5 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal:</span>
                      <span className="tabular-nums">Rs. {selectedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivery Fee:</span>
                      <span className="tabular-nums">Rs. {selectedOrder.deliveryCharge}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-rose-700">
                        <span>Discount:</span>
                        <span className="tabular-nums">-Rs. {selectedOrder.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                      <span>Total (COD):</span>
                      <span className="tabular-nums text-blue-700">Rs. {selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Status Audit History Timeline */}
                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-900 tabular-nums flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-blue-700" />
                      <span>Status History</span>
                    </h3>
                    <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-1">
                      {selectedOrder.statusHistory.map((h: any, i: number) => (
                        <div key={i} className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-[10px] px-1.5 py-0.2 rounded bg-slate-100">
                              {h.status}
                            </span>
                            <span className="text-[11px] text-slate-500 tabular-nums">
                              {new Date(h.timestamp).toLocaleString("en-PK")}
                            </span>
                          </div>
                          {h.note && <p className="text-[11px] text-slate-500">{h.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Revision Snapshots & Rollback */}
                {selectedOrder.revisions && selectedOrder.revisions.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-900 tabular-nums flex items-center gap-1.5">
                      <History className="h-4 w-4 text-purple-700" />
                      <span>Revisions & Rollback</span>
                    </h3>
                    <div className="space-y-2">
                      {selectedOrder.revisions.map((rev: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] text-[11px]"
                        >
                          <div>
                            <p className="text-slate-900 font-medium">Snapshot #{idx + 1}: {rev.note}</p>
                            <p className="text-slate-500 tabular-nums">{new Date(rev.at).toLocaleString("en-PK")}</p>
                          </div>
                          <button
                            onClick={() => handleRevertRevision(idx)}
                            className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-700 font-semibold transition"
                          >
                            Revert
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
