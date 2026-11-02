import mongoose, { Schema, Model } from "mongoose";
import { IProduct, IProductImage, IProductVariant, IProductSpec } from "@/types";

const ImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
  },
  { _id: false }
);

const VariantSchema = new Schema<IProductVariant>(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    priceModifier: { type: Number, default: 0 },
  },
  { _id: false }
);

const SpecSchema = new Schema<IProductSpec>(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    images: {
      type: [ImageSchema],
      default: [],
    },
    primaryImageIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    variants: {
      type: [VariantSchema],
      default: [],
    },
    specifications: {
      type: [SpecSchema],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    salesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ProductSchema.index({ category: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isPublished: 1 });
ProductSchema.index({ isPublished: 1, isFeatured: 1 });
ProductSchema.index({ isPublished: 1, isNewArrival: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ salesCount: -1 });
ProductSchema.index({ createdAt: -1 });

ProductSchema.virtual("primaryImage").get(function () {
  if (this.images && this.images.length > 0) {
    const idx = this.primaryImageIndex || 0;
    return this.images[idx] ?? this.images[0];
  }
  return null;
});

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
