import dbConnect from "@/lib/db";
import { Category, Product } from "@/lib/models";
import CategoriesClient from "./CategoriesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Categories",
};

export const revalidate = 0;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function AdminCategoriesPage() {
  await dbConnect();
  const weekAgo = new Date(Date.now() - WEEK_MS);

  const [categories, counts, totalProducts, newCategories, newProducts] = await Promise.all([
    Category.find().sort({ displayOrder: 1, name: 1 }).lean(),
    // One grouped query instead of a count per category.
    Product.aggregate<{ _id: unknown; n: number }>([{ $group: { _id: "$category", n: { $sum: 1 } } }]),
    Product.countDocuments(),
    Category.countDocuments({ createdAt: { $gte: weekAgo } }),
    Product.countDocuments({ createdAt: { $gte: weekAgo } }),
  ]);

  const countById = new Map(counts.map((c) => [String(c._id), c.n]));
  const categoriesWithCount = categories.map((cat) => ({ ...cat, itemCount: countById.get(String(cat._id)) ?? 0 }));

  return (
    <CategoriesClient
      initialCategories={JSON.parse(JSON.stringify(categoriesWithCount))}
      stats={{ totalProducts, newCategories, newProducts }}
    />
  );
}
