import { LayoutDashboard as HeaderIcon } from "lucide-react";
import Link from "next/link";
import dbConnect from "@/lib/db";
import { Order, Product, Category, Customer } from "@/lib/models";
import { OrderStatus } from "@/types";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  Truck,
  CheckCircle2,
} from "lucide-react";

export const revalidate = 10;

export default async function AdminDashboardPage() {
  await dbConnect();

  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    lowStockProducts,
    recentOrders,
    revenueAgg,
    totalProducts,
    totalCustomers,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: OrderStatus.PENDING }),
    Order.countDocuments({ status: OrderStatus.DELIVERED }),
    Product.find({ stock: { $lte: 5 } }).select("name stock sku").limit(5).lean(),
    Order.find().sort({ createdAt: -1 }).limit(8).lean(),
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Product.countDocuments(),
    Customer.countDocuments(),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex h-16 w-16 shrink-0 rounded-2xl bg-blue-50 text-blue-600 items-center justify-center">
            <HeaderIcon className="h-8 w-8" strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-[12px] font-semibold tracking-wide text-blue-600 uppercase">Dashboard</p>
            <h1 className="text-[26px] sm:text-[30px] leading-tight font-bold text-slate-900">Store Overview</h1>
            <p className="mt-0.5 text-[14px] text-slate-500">Real-time business performance and inventory indicators.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-900 border border-slate-200 transition"
          >
            Fulfillment Queue
          </Link>
          <Link
            href="/admin/products"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Gross Revenue</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-slate-900">
            Rs. {totalRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Across {totalOrders} total store purchases</p>
        </div>

        {/* Total Orders */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Orders</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-slate-900">
            {totalOrders}
          </div>
          <p className="text-[11px] text-blue-700 font-medium">{pendingOrders} awaiting confirmation</p>
        </div>

        {/* Delivered Orders */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Delivered & Paid</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-slate-900">
            {deliveredOrders}
          </div>
          <p className="text-[11px] text-slate-500">{totalCustomers} unique customer profiles</p>
        </div>

        {/* Total Catalog Items */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Products</span>
            <div className="h-8 w-8 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-700">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-slate-900">
            {totalProducts}
          </div>
          <p className="text-[11px] text-slate-500">Curated across all categories</p>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 sm:p-5 rounded-xl bg-amber-950/20 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Low Stock Warning</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {lowStockProducts.length} item(s) have 5 or fewer units remaining in warehouse.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map((p: any) => (
              <span
                key={p._id}
                className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs tabular-nums border border-amber-200"
              >
                {p.name}: <strong className="text-slate-900">{p.stock}</strong> left
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Customer Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest nationwide orders placed via Cash on Delivery</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No orders placed yet. Orders made by customers will appear here in real time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 tabular-nums border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">City</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {recentOrders.map((ord: any) => {
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
                      <td className="py-3 px-3 tabular-nums font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{ord.customer.name}</div>
                        <div className="text-[11px] text-slate-500 tabular-nums">{ord.customer.phone}</div>
                      </td>
                      <td className="py-3 px-3">{ord.customer.city}</td>
                      <td className="py-3 px-3 tabular-nums font-bold text-slate-900">
                        Rs. {ord.total.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusColors[ord.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(ord.createdAt).toLocaleDateString("en-PK", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/admin/orders?search=${ord.orderNumber}`}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-[11px] font-semibold transition"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
