import mongoose from "mongoose";
import { Order, Product, Counter, Customer, Notification, StoreSettings } from "@/lib/models";
import { OrderStatus, PaymentMethod, PaymentStatus, NotificationType, IOrder, IOrderItem } from "@/types";
import { nanoid, customAlphabet } from "nanoid";

// Unambiguous characters only (no 0/O, 1/I) so customers can read the reference over the phone.
const requestCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

/** Website orders carry a temporary "REQ-" number until an admin approves them. */
export function isAwaitingApproval(orderNumber: string): boolean {
  return orderNumber.startsWith("REQ-");
}

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "OrderError";
    this.status = status;
  }
}

function cleanString(val: any): string {
  return typeof val === "string" ? val.trim() : "";
}

function parseNumber(val: any, fieldName: string): number {
  const num = Number(val);
  if (!Number.isFinite(num) || num < 0) {
    throw new OrderError(`${fieldName} must be a valid non-negative number.`);
  }
  return num;
}

export async function getNextOrderNumber(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const counter = await Counter.findOneAndUpdate(
    { _id: `order_${today}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  ).lean();

  const seq = (counter?.seq ?? 1).toString().padStart(4, "0");
  return `AOP-${today}-${seq}`;
}

export function validateCustomer(data: any) {
  const customer = {
    name: cleanString(data.name),
    phone: cleanString(data.phone),
    city: cleanString(data.city),
    address: cleanString(data.address),
    email: cleanString(data.email) || undefined,
    notes: cleanString(data.notes),
  };

  if (!customer.name || !customer.phone || !customer.city || !customer.address) {
    throw new OrderError("Customer name, phone number, city, and delivery address are required.");
  }

  return customer;
}

export async function validateOrderItems(
  items: any[],
  options: { allowCustomPrice?: boolean; requirePublished?: boolean } = {}
): Promise<IOrderItem[]> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderError("Your order must contain at least one item.");
  }

  const result: IOrderItem[] = [];

  for (const item of items) {
    const qty = Math.floor(Number(item.quantity));
    if (!Number.isFinite(qty) || qty < 1) {
      throw new OrderError("Quantity must be at least 1.");
    }

    if (!mongoose.isValidObjectId(item.productId)) {
      throw new OrderError(`Invalid product ID in order: ${item.productId}`);
    }

    const product = await Product.findById(item.productId).select("+costPrice");
    if (!product) {
      throw new OrderError("One or more products in your cart could not be found.");
    }

    if (options.requirePublished && !product.isPublished) {
      throw new OrderError(`Product "${product.name}" is no longer available.`);
    }

    if (product.stock < qty) {
      throw new OrderError(`Insufficient stock for "${product.name}". Available: ${product.stock}.`);
    }

    const variant = item.variant
      ? product.variants.find((v) => v.value === item.variant || `${v.name}: ${v.value}` === item.variant)
      : undefined;

    let unitPrice = product.price + (variant?.priceModifier || 0);
    if (options.allowCustomPrice && item.unitPrice !== undefined && item.unitPrice !== "") {
      unitPrice = parseNumber(item.unitPrice, "Unit Price");
    }

    const image =
      product.images && product.images.length > 0
        ? product.images[product.primaryImageIndex || 0]?.url || product.images[0]?.url
        : "";

    result.push({
      productId: product._id.toString(),
      productName: product.name,
      sku: product.sku,
      variant: variant?.value || item.variant || "",
      image,
      unitPrice,
      unitCost: product.costPrice || 0,
      quantity: qty,
      subtotal: unitPrice * qty,
    });
  }

  return result;
}

export async function createOrder(data: {
  customer: any;
  items: any[];
  source?: "website" | "manual";
  deliveryCharge?: number;
  discount?: number;
  status?: OrderStatus;
  adminNotes?: string;
  courier?: string;
  trackingNumber?: string;
}): Promise<{ order: IOrder; accessToken: string }> {
  const isManual = data.source === "manual";
  const customer = validateCustomer(data.customer);
  const validatedItems = await validateOrderItems(data.items, {
    allowCustomPrice: isManual,
    requirePublished: !isManual,
  });

  const settings = await StoreSettings.findOne().lean();
  const defaultDeliveryCharge = settings?.deliveryCharge ?? 200;
  const freeThreshold = settings?.freeDeliveryThreshold ?? 3000;

  const subtotal = validatedItems.reduce((acc, it) => acc + it.subtotal, 0);

  let deliveryCharge = defaultDeliveryCharge;
  if (isManual && data.deliveryCharge !== undefined) {
    deliveryCharge = parseNumber(data.deliveryCharge, "Delivery charge");
  } else if (freeThreshold > 0 && subtotal >= freeThreshold) {
    deliveryCharge = 0;
  }

  const discount = isManual && data.discount ? parseNumber(data.discount, "Discount") : 0;
  const total = Math.max(0, subtotal + deliveryCharge - discount);
  // Manual orders are created by an admin, so they are approved immediately and get the official ID.
  const requestRef = isManual ? undefined : `REQ-${requestCode()}`;
  const orderNumber = isManual ? await getNextOrderNumber() : requestRef!;
  const accessToken = nanoid(32);
  const initialStatus =
    isManual && data.status && Object.values(OrderStatus).includes(data.status)
      ? data.status
      : OrderStatus.PENDING;

  const deductedItems: IOrderItem[] = [];
  try {
    // Deduct inventory atomically and verify every update matched.
    for (const it of validatedItems) {
      const result = await Product.updateOne(
        { _id: it.productId, stock: { $gte: it.quantity } },
        { $inc: { stock: -it.quantity, salesCount: it.quantity } }
      );
      if (result.modifiedCount !== 1) {
        throw new OrderError(`Insufficient stock for "${it.productName}". Please review your cart.`);
      }
      deductedItems.push(it);
    }
  } catch (error) {
    // If a multi-item order cannot reserve all stock, restore reservations already made.
    if (deductedItems.length > 0) {
      await Promise.all(
        deductedItems.map((it) =>
          Product.updateOne(
            { _id: it.productId },
            { $inc: { stock: it.quantity, salesCount: -it.quantity } }
          )
        )
      );
    }
    throw error;
  }

  const order = await Order.create({
    orderNumber,
    requestRef,
    approvedAt: isManual ? new Date() : undefined,
    accessToken,
    customer,
    items: validatedItems,
    subtotal,
    deliveryCharge,
    discount,
    total,
    paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
    paymentStatus: PaymentStatus.PENDING,
    status: initialStatus,
    source: data.source || "website",
    courier: cleanString(data.courier) || "Leopards Courier",
    trackingNumber: cleanString(data.trackingNumber),
    adminNotes: isManual ? cleanString(data.adminNotes) : "",
    alertAcknowledged: isManual,
    statusHistory: [
      {
        status: initialStatus,
        timestamp: new Date(),
        note: isManual ? "Order created manually by admin" : "Order placed by customer via Cash on Delivery",
      },
    ],
  });

  // Upsert Customer record
  await Customer.findOneAndUpdate(
    { phone: customer.phone },
    {
      $set: {
        name: customer.name,
        email: customer.email,
        city: customer.city,
        address: customer.address,
        lastOrderDate: new Date(),
      },
      $inc: { totalOrders: 1, totalSpent: total },
    },
    { upsert: true }
  );

  // Send Admin Notification
  if (!isManual) {
    await Notification.create({
      type: NotificationType.NEW_ORDER,
      title: `New order request ${orderNumber}`,
      message: `Rs. ${total.toLocaleString()} from ${customer.name} (${customer.city}). Awaiting approval.`,
      relatedId: order._id,
      relatedModel: "Order",
      link: `/admin/orders?search=${orderNumber}`,
    });
  }

  return { order: order.toObject(), accessToken };
}

export async function updateOrder(
  orderId: string,
  updates: {
    status?: OrderStatus;
    customer?: any;
    items?: any[];
    deliveryCharge?: number;
    discount?: number;
    courier?: string;
    trackingNumber?: string;
    adminNotes?: string;
    cancellationReason?: string;
    paymentStatus?: PaymentStatus;
    note?: string;
  }
): Promise<IOrder> {
  const order = await Order.findById(orderId).select("+revisions");
  if (!order) {
    throw new OrderError("Order not found.", 404);
  }

  // Snapshot before change
  const currentSnapshot = JSON.parse(
    JSON.stringify({
      customer: order.customer,
      items: order.items,
      subtotal: order.subtotal,
      deliveryCharge: order.deliveryCharge,
      discount: order.discount,
      total: order.total,
      status: order.status,
      courier: order.courier,
      trackingNumber: order.trackingNumber,
      cancellationReason: order.cancellationReason,
      adminNotes: order.adminNotes,
    })
  );

  const prevStatus = order.status;

  if (updates.customer) {
    order.customer = validateCustomer({ ...order.customer, ...updates.customer });
  }

  if (updates.deliveryCharge !== undefined) {
    order.deliveryCharge = parseNumber(updates.deliveryCharge, "Delivery charge");
  }

  if (updates.discount !== undefined) {
    order.discount = parseNumber(updates.discount, "Discount");
  }

  if (updates.courier !== undefined) order.courier = cleanString(updates.courier);
  if (updates.trackingNumber !== undefined) order.trackingNumber = cleanString(updates.trackingNumber);
  if (updates.adminNotes !== undefined) order.adminNotes = cleanString(updates.adminNotes);
  if (updates.cancellationReason !== undefined) order.cancellationReason = cleanString(updates.cancellationReason);
  if (updates.paymentStatus && Object.values(PaymentStatus).includes(updates.paymentStatus)) {
    order.paymentStatus = updates.paymentStatus;
  }

  // Handle status transition
  if (updates.status && Object.values(OrderStatus).includes(updates.status)) {
    if (updates.status !== prevStatus) {
      order.status = updates.status;

      // Approval: the first move out of "pending" (other than cancelling) assigns the official order ID.
      let approvalNote = "";
      if (
        isAwaitingApproval(order.orderNumber) &&
        updates.status !== OrderStatus.PENDING &&
        updates.status !== OrderStatus.CANCELLED
      ) {
        order.orderNumber = await getNextOrderNumber();
        order.approvedAt = new Date();
        approvalNote = `Approved — order ID ${order.orderNumber} assigned`;
      }
      order.statusHistory.push({
        status: updates.status,
        timestamp: new Date(),
        note: approvalNote || cleanString(updates.note) || `Status changed from ${prevStatus} to ${updates.status}`,
      });

      // Auto-restock if cancelled
      if (updates.status === OrderStatus.CANCELLED && prevStatus !== OrderStatus.CANCELLED) {
        for (const it of order.items) {
          await Product.updateOne({ _id: it.productId }, { $inc: { stock: it.quantity } });
        }
        await Notification.create({
          type: NotificationType.ORDER_CANCELLED,
          title: `Order #${order.orderNumber} Cancelled`,
          message: `Reason: ${order.cancellationReason || "Not specified"}. Inventory automatically restocked.`,
          relatedId: order._id,
          relatedModel: "Order",
          link: `/admin/orders?search=${order.orderNumber}`,
        });
      }
    }
  }

  // Recalculate totals
  const subtotal = order.items.reduce((acc, it) => acc + it.subtotal, 0);
  order.subtotal = subtotal;
  order.total = Math.max(0, subtotal + order.deliveryCharge - order.discount);

  // Push to revisions
  const revisions = order.revisions || [];
  revisions.push({
    at: new Date(),
    note: cleanString(updates.note) || "Order updated",
    snapshot: currentSnapshot,
  });
  order.revisions = revisions.slice(-25);

  await order.save();
  return order.toObject();
}
