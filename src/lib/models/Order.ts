import mongoose, { Schema, Model } from "mongoose";
import {
  IOrder,
  IOrderCustomer,
  IOrderItem,
  IOrderStatusHistory,
  IOrderRevision,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types";

const CustomerSubSchema = new Schema<IOrderCustomer>(
  {
    name: { type: String, required: [true, "Customer name is required"], trim: true },
    phone: { type: String, required: [true, "Phone number is required"], trim: true },
    email: { type: String, trim: true, lowercase: true },
    city: { type: String, required: [true, "City is required"], trim: true },
    address: { type: String, required: [true, "Address is required"], trim: true },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const OrderItemSubSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    variant: { type: String, default: "" },
    image: { type: String, default: "" },
    unitPrice: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const StatusHistorySubSchema = new Schema<IOrderStatusHistory>(
  {
    status: { type: String, enum: Object.values(OrderStatus), required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const RevisionSubSchema = new Schema<IOrderRevision>(
  {
    at: { type: Date, default: Date.now },
    note: { type: String, default: "" },
    snapshot: Schema.Types.Mixed,
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customer: {
      type: CustomerSubSchema,
      required: true,
    },
    items: {
      type: [OrderItemSubSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.CASH_ON_DELIVERY,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    statusHistory: {
      type: [StatusHistorySubSchema],
      default: [],
    },
    cancellationReason: {
      type: String,
      default: "",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    courier: {
      type: String,
      default: "Leopards Courier",
      trim: true,
    },
    trackingNumber: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      enum: ["website", "manual"],
      default: "website",
    },
    accessToken: {
      type: String,
      select: false,
    },
    // Temporary customer-facing reference for website orders. The official orderNumber replaces
    // the "REQ-" placeholder when an admin approves the order; this field keeps old links working.
    requestRef: {
      type: String,
      trim: true,
    },
    approvedAt: {
      type: Date,
    },
    alertAcknowledged: {
      type: Boolean,
      default: true,
    },
    revisions: {
      type: [RevisionSubSchema],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

OrderSchema.index({ status: 1 });
OrderSchema.index({ requestRef: 1 }, { unique: true, sparse: true });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "customer.phone": 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ alertAcknowledged: 1, createdAt: -1 });

OrderSchema.pre("save", function () {
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [
      {
        status: this.status,
        timestamp: new Date(),
        note: "Order placed",
      },
    ];
  }
});

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
