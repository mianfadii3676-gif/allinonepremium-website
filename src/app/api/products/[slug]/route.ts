import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Product } from "@/lib/models";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;
    const product = await Product.findOne({ slug, isPublished: true })
      .populate("category", "name slug")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isPublished: true,
    })
      .limit(4)
      .populate("category", "name slug")
      .lean();

    return NextResponse.json({
      success: true,
      product,
      relatedProducts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}
