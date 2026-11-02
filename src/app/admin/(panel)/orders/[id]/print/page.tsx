import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import { Order, StoreSettings } from "@/lib/models";
import PrintActions from "./PrintActions";

export default async function PrintOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await dbConnect();
  const { id } = await params;

  const [order, settings] = await Promise.all([
    Order.findById(id).lean(),
    StoreSettings.findOne().lean(),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-black p-6 sm:p-12 font-sans">
      <PrintActions />

      {/* Invoice Document Canvas */}
      <div className="max-w-3xl mx-auto border border-gray-300 p-8 rounded-xl space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-250 pb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              {settings?.storeName || "allinonepermium.store"}
            </h1>
            <p className="text-xs text-gray-600 mt-1 max-w-xs">
              {settings?.address || "Tech Hub Plaza, Main Boulevard, Gulberg III, Lahore, Pakistan"}
            </p>
            <p className="text-xs text-gray-600">
              Phone: {settings?.contactPhone || "+92 300 1234567"} | Email: {settings?.contactEmail || "support@allinonepremium.store"}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded bg-black text-white text-xs font-bold uppercase tracking-wider">
              Packing Slip & Invoice
            </span>
            <p className="text-sm font-mono font-bold mt-2 text-gray-900">#{order.orderNumber}</p>
            <p className="text-xs text-gray-500 font-mono">
              Date: {new Date(order.createdAt!).toLocaleDateString("en-PK")}
            </p>
          </div>
        </div>

        {/* Dispatch & Courier Barcode Area */}
        <div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-gray-50 border border-gray-200 text-xs">
          <div>
            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
              Courier Service
            </h3>
            <p className="font-semibold text-gray-900 text-sm mt-0.5">{order.courier || "Leopards Courier"}</p>
            {order.trackingNumber && (
              <p className="font-mono text-gray-700 mt-1">Tracking #: {order.trackingNumber}</p>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
              Payment Terms
            </h3>
            <p className="font-bold text-red-600 text-sm mt-0.5">
              CASH ON DELIVERY (COD): Rs. {order.total.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-600">Collect full cash amount upon handover.</p>
          </div>
        </div>

        {/* Customer Address */}
        <div className="text-xs space-y-1">
          <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Deliver To:</h3>
          <p className="font-bold text-sm text-gray-900">{order.customer.name}</p>
          <p className="text-gray-800 font-semibold font-mono">Phone: {order.customer.phone}</p>
          <p className="text-gray-800">City: <strong>{order.customer.city}</strong></p>
          <p className="text-gray-800 leading-relaxed">Address: {order.customer.address}</p>
          {order.customer.notes && (
            <p className="text-gray-600 italic pt-1">Notes: &ldquo;{order.customer.notes}&rdquo;</p>
          )}
        </div>

        {/* Items Table */}
        <table className="w-full text-left text-xs border border-gray-250">
          <thead className="bg-gray-100 uppercase text-gray-700 font-mono text-[11px]">
            <tr>
              <th className="py-2.5 px-3 border-b border-gray-250">Item Description</th>
              <th className="py-2.5 px-3 border-b border-gray-250">SKU</th>
              <th className="py-2.5 px-3 border-b border-gray-250 text-center">Qty</th>
              <th className="py-2.5 px-3 border-b border-gray-250 text-right">Unit Price</th>
              <th className="py-2.5 px-3 border-b border-gray-250 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {order.items.map((it: any, i: number) => (
              <tr key={i}>
                <td className="py-2.5 px-3">
                  <span className="font-semibold text-gray-900">{it.productName}</span>
                  {it.variant && <span className="block text-[10px] text-gray-500">Variant: {it.variant}</span>}
                </td>
                <td className="py-2.5 px-3 font-mono text-gray-600">{it.sku}</td>
                <td className="py-2.5 px-3 text-center font-bold font-mono">{it.quantity}</td>
                <td className="py-2.5 px-3 text-right font-mono">Rs. {it.unitPrice.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold">Rs. {it.subtotal.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Summary */}
        <div className="flex justify-end text-xs">
          <div className="w-64 space-y-2 border-t border-gray-300 pt-3">
            <div className="flex justify-between text-gray-600">
              <span>Items Subtotal:</span>
              <span className="font-mono">Rs. {order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charge:</span>
              <span className="font-mono">
                {order.deliveryCharge === 0 ? "FREE" : `Rs. ${order.deliveryCharge}`}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span className="font-mono">-Rs. {order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-2 text-gray-900">
              <span>Total Payable (COD):</span>
              <span className="font-mono text-base">Rs. {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="border-t border-gray-200 pt-6 text-[10px] text-gray-500 text-center space-y-1">
          <p>Thank you for choosing allinonepermium.store — Premium Mobile Accessories & Electronics.</p>
          <p>For replacement inquiries or warranty support, WhatsApp us at +92 300 1234567 within 7 days of delivery.</p>
        </div>
      </div>
    </div>
  );
}
