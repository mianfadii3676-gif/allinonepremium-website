import { NextRequest, NextResponse } from "next/server";
import { escapeRegex } from "@/lib/utils/escapeRegex";
import dbConnect from "@/lib/db";
import { Product } from "@/lib/models";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import slugify from "slugify";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category");
    const stockStatus = searchParams.get("stock"); // "in-stock" | "low-stock" | "out-of-stock"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: escapeRegex(search), $options: "i" } },
        { sku: { $regex: escapeRegex(search), $options: "i" } },
        { tags: { $in: [new RegExp(escapeRegex(search), "i")] } },
      ];
    }
    if (category && category !== "all") {
      query.category = category;
    }
    if (stockStatus === "out-of-stock") {
      query.stock = 0;
    } else if (stockStatus === "low-stock") {
      query.stock = { $gt: 0, $lte: 5 };
    } else if (stockStatus === "in-stock") {
      query.stock = { $gt: 5 };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to load products" },
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

    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, message: "Product name is required" }, { status: 400 });
    }
    if (body.price === undefined || Number(body.price) < 0) {
      return NextResponse.json({ success: false, message: "Valid product price is required" }, { status: 400 });
    }

    const name = body.name.trim();
    const slug = body.slug
      ? slugify(body.slug, { lower: true, strict: true })
      : slugify(name, { lower: true, strict: true });

    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: `Product with slug "${slug}" already exists.` },
        { status: 400 }
      );
    }

    const sku = (body.sku?.trim() || `AOP-${Date.now().toString().slice(-6)}`).toUpperCase();
    const existingSku = await Product.findOne({ sku });
    if (existingSku) {
      return NextResponse.json(
        { success: false, message: `Product SKU "${sku}" is already in use.` },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name,
      slug,
      sku,
      description: body.description?.trim() || "",
      category: body.category || null,
      images: Array.isArray(body.images) ? body.images : [],
      primaryImageIndex: Number(body.primaryImageIndex) || 0,
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      costPrice: body.costPrice ? Number(body.costPrice) : 0,
      stock: Number(body.stock) || 0,
      variants: Array.isArray(body.variants) ? body.variants : [],
      specifications: Array.isArray(body.specifications) ? body.specifications : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      isFeatured: Boolean(body.isFeatured),
      isNewArrival: Boolean(body.isNewArrival),
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
    });

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
