import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Category, Product } from "@/lib/models";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import slugify from "slugify";

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

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    if (body.name) category.name = body.name.trim();
    if (body.slug) {
      const slug = slugify(body.slug, { lower: true, strict: true });
      const dup = await Category.findOne({ slug, _id: { $ne: id } });
      if (dup) {
        return NextResponse.json(
          { success: false, message: "Slug is already used by another category" },
          { status: 400 }
        );
      }
      category.slug = slug;
    }
    if (body.description !== undefined) category.description = body.description.trim();
    if (body.image !== undefined) category.image = body.image;
    if (body.displayOrder !== undefined) category.displayOrder = Number(body.displayOrder);
    if (body.isActive !== undefined) category.isActive = Boolean(body.isActive);

    await category.save();
    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update category" },
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

    const inUse = await Product.countDocuments({ category: id });
    if (inUse > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete category: ${inUse} product(s) are currently assigned to it. Reassign or delete them first.`,
        },
        { status: 400 }
      );
    }

    await Category.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
