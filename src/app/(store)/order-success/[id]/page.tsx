import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import { Order } from "@/lib/models";
import { CheckCircle2, ArrowRight, MessageCircle } from "lucide-react";

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  await dbConnect();
  const { id } = await params;
  const { t } = await searchParams;

  // The secret token is always required: order numbers are sequential and easy to guess,
  // and this page shows the customer's name, phone and address.
  if (!t || typeof t !== "string") notFound();
  // Accept the temporary "REQ-" reference too, so links sent before approval keep working.
  const query = { $or: [{ orderNumber: id }, { requestRef: id }], accessToken: t };

  const order = await Order.findOne(query).lean() as unknown as {
    orderNumber: string;
    status: string;
    trackingNumber?: string;
    subtotal: number;
    deliveryCharge: number;
    discount?: number;
    total: number;
    customer: { name: string; phone: string; city: string; address: string; notes?: string };
    items: { productName: string; variant?: string; image?: string; unitPrice: number; quantity: number; subtotal: number }[];
  } | null;
  if (!order) {
    notFound();
  }

  const steps = [
    { label: "Received", desc: "Recorded in our system", done: true },
    {
      label: "Confirmed",
      desc: "Verified with you",
      done: ["confirmed", "processing", "shipped", "delivered"].includes(order.status),
    },
    {
      label: "Dispatched",
      desc: order.trackingNumber ? `Tracking: ${order.trackingNumber}` : "Handed to the courier",
      done: ["shipped", "delivered"].includes(order.status),
    },
    { label: "Delivered", desc: "Paid in cash", done: order.status === "delivered" },
  ];

  const awaitingApproval = order.orderNumber.startsWith("REQ-");

  const whatsappMessage = encodeURIComponent(
    `Hello Allinonepermium, I would like to ask about my order #${order.orderNumber}.`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-night/10 border border-ink/20 text-ink text-[13px] font-medium">
          <CheckCircle2 className="h-4 w-4" />
          {awaitingApproval ? "Order received — awaiting confirmation" : "Order confirmed — cash on delivery"}
        </span>
        <h1 className="font-display text-4xl sm:text-5xl text-ink tracking-tight mt-5">
          Thank you{order.customer.name ? `, ${order.customer.name.split(" ")[0]}` : ""}.
        </h1>
        <p className="text-ink-soft mt-3 max-w-md mx-auto">
          {awaitingApproval ? (
            <>
              Your request reference is{" "}
              <span className="font-semibold text-ink tabular-nums">{order.orderNumber}</span>. Our team will review it
              shortly and assign your official order ID. Keep this page bookmarked to check the status.
            </>
          ) : (
            <>
              Order <span className="font-semibold text-ink tabular-nums">#{order.orderNumber}</span> is confirmed.
              We will call you before dispatch.
            </>
          )}
        </p>
      </div>

      <div className="mt-10 bg-white border border-line rounded-2xl p-6 sm:p-8 paper-card">
        <h2 className="font-display text-xl text-ink">Delivery status</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-5">
          {steps.map((step, idx) => (
            <li
              key={idx}
              className={`p-4 rounded-xl border text-left ${
                step.done
                  ? "bg-night/5 border-ink/20"
                  : "bg-paper border-line"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold tabular-nums ${
                  step.done ? "bg-night text-white" : "bg-line text-ink-faint"
                }`}
                aria-hidden="true"
              >
                {idx + 1}
              </span>
              <p className="text-sm font-medium text-ink mt-2">{step.label}</p>
              <p className="text-xs text-ink-faint mt-0.5 leading-relaxed">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
        <div className="md:col-span-7 bg-white border border-line rounded-2xl p-6 sm:p-7 paper-card">
          <h2 className="font-display text-xl text-ink pb-3 border-b border-line">
            Receipt
          </h2>
          <div className="divide-y divide-line">
            {order.items.map((it, i) => (
              <div key={i} className="py-3.5 flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-paper-deep border border-line shrink-0">
                  <Image
                    src={it.image || "/placeholder.svg"}
                    alt={it.productName}
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-ink truncate">{it.productName}</h4>
                  {it.variant && (
                    <p className="text-xs text-ink-faint">{it.variant}</p>
                  )}
                  <p className="text-xs text-ink-faint tabular-nums">
                    {it.quantity} × Rs. {it.unitPrice.toLocaleString()}
                  </p>
                </div>
                <span className="text-sm font-semibold text-ink tabular-nums">
                  Rs. {it.subtotal.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <dl className="pt-4 border-t border-line space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-faint">Subtotal</dt>
              <dd className="text-ink font-medium tabular-nums">Rs. {order.subtotal.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-faint">Delivery</dt>
              <dd className="text-ink font-medium">
                {order.deliveryCharge === 0 ? "Free" : `Rs. ${order.deliveryCharge}`}
              </dd>
            </div>
            {!!order.discount && order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-faint">Discount</dt>
                <dd className="text-navy-700 tabular-nums">−Rs. {order.discount.toLocaleString()}</dd>
              </div>
            )}
            <div className="pt-2 border-t border-line flex justify-between items-baseline">
              <dt className="font-medium text-ink">Due on delivery</dt>
              <dd className="font-display text-2xl text-ink tabular-nums">
                Rs. {order.total.toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-line rounded-2xl p-6 paper-card">
            <h3 className="font-display text-lg text-ink pb-2 border-b border-line">
              Deliver to
            </h3>
            <div className="text-sm text-ink-soft space-y-1.5 leading-relaxed mt-3">
              <p className="font-semibold text-ink">{order.customer.name}</p>
              <p>Phone: <span className="text-ink tabular-nums">{order.customer.phone}</span></p>
              <p>City: <span className="text-ink">{order.customer.city}</span></p>
              <p>Address: <span className="text-ink">{order.customer.address}</span></p>
              {order.customer.notes && (
                <p className="pt-2 italic text-ink-faint">“{order.customer.notes}”</p>
              )}
            </div>
          </div>

          <div className="bg-night rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-navy-700" />
              <h3 className="font-display text-lg text-white">Need to change something?</h3>
            </div>
            <p className="text-sm text-white/75 leading-relaxed mt-2">
              Message us on WhatsApp about this order — a person replies, not a bot.
            </p>
            <a
              href={`https://wa.me/923001234567?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-paper text-ink font-medium text-sm hover:bg-white transition"
            >
              <span>Message on WhatsApp</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <Link
            href="/shop"
            className="btn-line w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-full text-sm font-medium bg-white"
          >
            <span>Continue shopping</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
