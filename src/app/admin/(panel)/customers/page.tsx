import type { Metadata } from "next";
import Link from "next/link";
import { Users, UserPlus, Repeat, Wallet, Search, UserX } from "lucide-react";
import dbConnect from "@/lib/db";
import { Customer } from "@/lib/models";
import { escapeRegex } from "@/lib/utils/escapeRegex";
import { PageHeader, StatCard, adminInput } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Customers" };
export const revalidate = 0;

const PAGE_SIZE = 50;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const { search = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  await dbConnect();

  const term = search.trim();
  const filter = term
    ? {
        $or: [
          { name: { $regex: escapeRegex(term), $options: "i" } },
          { phone: { $regex: escapeRegex(term), $options: "i" } },
          { city: { $regex: escapeRegex(term), $options: "i" } },
          { email: { $regex: escapeRegex(term), $options: "i" } },
        ],
      }
    : {};

  const [customers, matching, total, repeat, newThisWeek, revenue] = await Promise.all([
    Customer.find(filter).sort({ lastOrderDate: -1 }).skip((pageNum - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    Customer.countDocuments(filter),
    Customer.countDocuments(),
    Customer.countDocuments({ totalOrders: { $gte: 2 } }),
    Customer.countDocuments({ createdAt: { $gte: new Date(Date.now() - WEEK_MS) } }),
    Customer.aggregate<{ sum: number }>([{ $group: { _id: null, sum: { $sum: "$totalSpent" } } }]),
  ]);

  const lifetime = revenue[0]?.sum ?? 0;
  const pages = Math.max(1, Math.ceil(matching / PAGE_SIZE));
  const pageHref = (p: number) => `/admin/customers?${new URLSearchParams({ ...(term ? { search: term } : {}), page: String(p) })}`;

  return (
    <div className="space-y-6">
      <PageHeader icon={Users} eyebrow="Customers" title="Customers" description="Everyone who has ordered, with their order count and lifetime spend." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} tone="blue" label="Total Customers" value={total.toLocaleString("en-PK")} trend={newThisWeek > 0 ? `+${newThisWeek} this week` : undefined} />
        <StatCard icon={Repeat} tone="green" label="Repeat Customers" value={repeat.toLocaleString("en-PK")} note={total ? `${((repeat / total) * 100).toFixed(1)}% ordered 2+ times` : "No customers yet"} />
        <StatCard icon={Wallet} tone="violet" label="Lifetime Spend" value={`Rs. ${lifetime.toLocaleString("en-PK")}`} note="Across all orders" />
        <StatCard icon={UserPlus} tone="orange" label="New This Week" value={newThisWeek} note="First order in the last 7 days" />
      </div>

      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-5">
          <h2 className="flex items-center gap-3 text-[18px] font-bold text-slate-900 mr-auto">
            <Users className="h-6 w-6" strokeWidth={1.8} /> Customer Directory
          </h2>
          <form className="relative" role="search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input name="search" defaultValue={term} placeholder="Search name, phone, city…" aria-label="Search customers" className={`${adminInput} w-64 pl-9`} />
          </form>
        </div>

        {customers.length === 0 ? (
          <div className="px-5 pb-12 pt-6 text-center">
            <UserX className="h-10 w-10 mx-auto text-slate-300" strokeWidth={1.5} />
            <p className="mt-3 font-semibold text-slate-800">{term ? "No customers match your search" : "No customers yet"}</p>
            <p className="text-[13px] text-slate-500 mt-1">{term ? "Try a name, phone number or city." : "Customers appear here after their first order."}</p>
          </div>
        ) : (
          <div className="px-5 pb-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[14px]">
              <thead>
                <tr className="bg-slate-50 text-[12px] font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="py-3.5 px-4 rounded-l-xl">Customer</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">City</th>
                  <th className="py-3.5 px-4">Orders</th>
                  <th className="py-3.5 px-4">Total spent</th>
                  <th className="py-3.5 px-4 rounded-r-xl">Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={String(c._id)} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[13px] font-bold uppercase">
                          {c.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          {c.email && <p className="text-[13px] text-slate-500 truncate">{c.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 tabular-nums text-slate-700">
                      <Link href={`/admin/orders?search=${encodeURIComponent(c.phone)}`} className="hover:text-blue-600 hover:underline">
                        {c.phone}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{c.city || "—"}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex h-7 items-center px-3 rounded-full bg-slate-100 text-[12px] font-semibold text-slate-700 tabular-nums">
                        {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums">Rs. {c.totalSpent.toLocaleString("en-PK")}</td>
                    <td className="py-3 px-4 text-slate-500 tabular-nums">
                      {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pages > 1 && (
              <nav className="mt-4 flex items-center justify-between text-[13px] text-slate-500" aria-label="Pagination">
                <span>
                  Page {pageNum} of {pages} · {matching.toLocaleString("en-PK")} customers
                </span>
                <span className="flex gap-2">
                  {pageNum > 1 && (
                    <Link href={pageHref(pageNum - 1)} className="h-9 px-3 rounded-lg border border-slate-200 flex items-center hover:bg-slate-50">
                      Previous
                    </Link>
                  )}
                  {pageNum < pages && (
                    <Link href={pageHref(pageNum + 1)} className="h-9 px-3 rounded-lg border border-slate-200 flex items-center hover:bg-slate-50">
                      Next
                    </Link>
                  )}
                </span>
              </nav>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
