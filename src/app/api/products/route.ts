import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Product, Category } from "@/lib/models";
import { escapeRegex } from "@/lib/utils/escapeRegex";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search")?.trim();
    const categorySlug = searchParams.get("category")?.trim();
    const sort = searchParams.get("sort") || "featured";
    const isFeatured = searchParams.get("featured");
    const isNew = searchParams.get("new");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "24", 10)));
    const skip = (page - 1) * limit;

    const query: any = { isPublished: true };

    if (search) {
      // Escape user input so it is matched literally rather than run as a regular expression.
      const pattern = escapeRegex(search);
      query.$or = [
        { name: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
        { tags: { $in: [new RegExp(pattern, "i")] } },
        { sku: { $regex: pattern, $options: "i" } },
      ];
    }

    if (categorySlug && categorySlug !== "all") {
      const categoryDoc = await Category.findOne({ slug: categorySlug }).lean();
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    if (isFeatured === "true" || isFeatured === "1") {
      query.isFeatured = true;
    }

    if (isNew === "true" || isNew === "1") {
      query.isNewArrival = true;
    }

    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOptions: any = { isFeatured: -1, createdAt: -1 };
    if (sort === "price-asc") sortOptions = { price: 1 };
    else if (sort === "price-desc") sortOptions = { price: -1 };
    else if (sort === "newest") sortOptions = { createdAt: -1 };
    else if (sort === "popular" || sort === "sales") sortOptions = { salesCount: -1 };
    else if (sort === "rating") sortOptions = { rating: -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .sort(sortOptions)
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
      { success: false, message: err.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
