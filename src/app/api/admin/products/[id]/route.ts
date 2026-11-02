import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Product } from "@/lib/models";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import slugify from "slugify";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;
    const product = await Product.findById(id).select("+costPrice").populate("category").lean();

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to load product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    if (body.name) product.name = body.name.trim();
    if (body.slug) {
      const slug = slugify(body.slug, { lower: true, strict: true });
      const dup = await Product.findOne({ slug, _id: { $ne: id } });
      if (dup) {
        return NextResponse.json(
          { success: false, message: "Slug is already used by another product" },
          { status: 400 }
        );
      }
      product.slug = slug;
    }
    if (body.sku) {
      const sku = body.sku.trim().toUpperCase();
      const dup = await Product.findOne({ sku, _id: { $ne: id } });
      if (dup) {
        return NextResponse.json(
          { success: false, message: "SKU is already in use by another product" },
          { status: 400 }
        );
      }
      product.sku = sku;
    }

    if (body.description !== undefined) product.description = body.description.trim();
    if (body.category !== undefined) product.category = body.category || null;
    if (Array.isArray(body.images)) product.images = body.images;
    if (body.primaryImageIndex !== undefined) product.primaryImageIndex = Number(body.primaryImageIndex);
    if (body.price !== undefined) product.price = Number(body.price);
    if (body.originalPrice !== undefined) product.originalPrice = body.originalPrice ? Number(body.originalPrice) : undefined;
    if (body.costPrice !== undefined) product.costPrice = Number(body.costPrice);
    if (body.stock !== undefined) product.stock = Math.max(0, Number(body.stock));
    if (Array.isArray(body.variants)) product.variants = body.variants;
    if (Array.isArray(body.specifications)) product.specifications = body.specifications;
    if (Array.isArray(body.tags)) product.tags = body.tags;
    if (body.isFeatured !== undefined) product.isFeatured = Boolean(body.isFeatured);
    if (body.isNewArrival !== undefined) product.isNewArrival = Boolean(body.isNewArrival);
    if (body.isPublished !== undefined) product.isPublished = Boolean(body.isPublished);

    await product.save();
    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
