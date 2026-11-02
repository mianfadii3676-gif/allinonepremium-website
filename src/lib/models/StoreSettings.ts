import mongoose, { Schema, Model } from "mongoose";
import { IStoreSettings, PaymentMethod } from "@/types";

const SocialLinksSchema = new Schema(
  {
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
  },
  { _id: false }
);

const PoliciesSchema = new Schema(
  {
    returns: { type: String, default: "" },
    privacy: { type: String, default: "" },
    shipping: { type: String, default: "" },
  },
  { _id: false }
);

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    storeName: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      default: "allinonepermium.store",
    },
    logoUrl: { type: String, default: "" },
    tagline: { type: String, default: "" },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    address: { type: String, trim: true },
    deliveryCharge: { type: Number, default: 200, min: 0 },
    freeDeliveryThreshold: { type: Number, default: 3000, min: 0 },
    currency: { type: String, default: "PKR", uppercase: true, trim: true },
    paymentMethods: {
      type: [String],
      enum: Object.values(PaymentMethod),
      default: [PaymentMethod.CASH_ON_DELIVERY],
    },
    socialLinks: { type: SocialLinksSchema, default: () => ({}) },
    policies: { type: PoliciesSchema, default: () => ({}) },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    isMaintenanceMode: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const StoreSettings: Model<IStoreSettings> =
  mongoose.models.StoreSettings || mongoose.model<IStoreSettings>("StoreSettings", StoreSettingsSchema);

export default StoreSettings;
