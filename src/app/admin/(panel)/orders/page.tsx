import dbConnect from "@/lib/db";
import { Order } from "@/lib/models";
import OrdersClient from "./OrdersClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Fulfillment Desk | allinonepermium Admin",
};

export const revalidate = 0;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search = "" } = await searchParams;
  await dbConnect();

  const [orders, statusCountsAgg, total] = await Promise.all([
    Order.find().select("+revisions").sort({ createdAt: -1 }).limit(100).lean(),
    Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Order.countDocuments(),
  ]);

  const counts: Record<string, number> = { all: total };
  statusCountsAgg.forEach((s) => {
    counts[s._id] = s.count;
  });

  return (
    <OrdersClient
      key={search}
      initialSearch={search}
      initialOrders={JSON.parse(JSON.stringify(orders))}
      statusCounts={counts}
    />
  );
}
