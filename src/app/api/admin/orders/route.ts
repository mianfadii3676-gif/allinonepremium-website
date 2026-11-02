import { NextRequest, NextResponse } from "next/server";
import { escapeRegex } from "@/lib/utils/escapeRegex";
import dbConnect from "@/lib/db";
import { Order } from "@/lib/models";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createOrder, OrderError } from "@/lib/orders/orderService";
import { OrderStatus } from "@/types";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (search) {
      query.$or = [
        { orderNumber: { $regex: escapeRegex(search), $options: "i" } },
        { "customer.name": { $regex: escapeRegex(search), $options: "i" } },
        { "customer.phone": { $regex: escapeRegex(search), $options: "i" } },
        { "customer.city": { $regex: escapeRegex(search), $options: "i" } },
        { trackingNumber: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }
    if (status && status !== "all" && Object.values(OrderStatus).includes(status as any)) {
      query.status = status;
    }

    const [orders, total, statusCounts] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const counts: Record<string, number> = { all: total };
    statusCounts.forEach((s) => {
      counts[s._id] = s.count;
    });

    return NextResponse.json({
      success: true,
      orders,
      statusCounts: counts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to load orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await req.json();

    const { order } = await createOrder({
      ...body,
      source: "manual",
    });

    return NextResponse.json({
      success: true,
      order,
      message: `Manual order #${order.orderNumber} created successfully`,
    });
  } catch (err: any) {
    if (err instanceof OrderError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { success: false, message: err.message || "Failed to create manual order" },
      { status: 500 }
    );
  }
}
