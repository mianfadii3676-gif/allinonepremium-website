import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Category, Product } from "@/lib/models";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import slugify from "slugify";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const categories = await Category.find().sort({ displayOrder: 1, name: 1 }).lean();

    // Attach item count to each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const itemCount = await Product.countDocuments({ category: cat._id });
        return { ...cat, itemCount };
      })
    );

    return NextResponse.json({ success: true, categories: categoriesWithCount });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to load categories" },
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

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    const slug = body.slug ? slugify(body.slug, { lower: true, strict: true }) : slugify(name, { lower: true, strict: true });

    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Category with slug "${slug}" already exists.` },
        { status: 400 }
      );
    }

    const category = await Category.create({
      name,
      slug,
      description: body.description?.trim() || "",
      image: body.image || { url: "", alt: "" },
      displayOrder: Number(body.displayOrder) || 0,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    });

    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to create category" },
      { status: 500 }
    );
  }
}
