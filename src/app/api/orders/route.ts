import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { createOrder, OrderError } from "@/lib/orders/orderService";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body || !body.customer || !body.items) {
      return NextResponse.json(
        { success: false, message: "Invalid order data provided." },
        { status: 400 }
      );
    }

    const { order, accessToken } = await createOrder({
      customer: body.customer,
      items: body.items,
      source: "website",
    });

    return NextResponse.json({
      success: true,
      message: "Order placed successfully!",
      order: {
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        accessToken,
      },
    });
  } catch (err: any) {
    console.error("Order placement error:", err);
    if (err instanceof OrderError) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { success: false, message: err.message || "An unexpected error occurred while processing your order." },
      { status: 500 }
    );
  }
}
