import dbConnect from "@/lib/db";
import { Product, Category } from "@/lib/models";
import ShopClient from "./ShopClient";
import { escapeRegex } from "@/lib/utils/escapeRegex";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Mobile Accessories & Electronics | allinonepermium",
  description:
    "Explore our full catalogue of GaN chargers, MagSafe batteries, high-fidelity wireless earbuds, and AMOLED smartwatches.",
};

export const revalidate = 30;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; search?: string }>;
}) {
  await dbConnect();
  const sp = await searchParams;

  const categorySlug = sp.category?.trim();
  const sort = sp.sort?.trim() || "featured";
  const search = sp.search?.trim() || "";

  const query: any = { isPublished: true };

  if (categorySlug && categorySlug !== "all") {
    const catDoc = await Category.findOne({ slug: categorySlug }).lean();
    if (catDoc) {
      query.category = catDoc._id;
    }
  }

  if (search) {
    const pattern = escapeRegex(search);
    query.$or = [
      { name: { $regex: pattern, $options: "i" } },
      { description: { $regex: pattern, $options: "i" } },
      { sku: { $regex: pattern, $options: "i" } },
      { tags: { $in: [new RegExp(pattern, "i")] } },
    ];
  }

  let sortOptions: any = { isFeatured: -1, createdAt: -1 };
  if (sort === "price-asc") sortOptions = { price: 1 };
  else if (sort === "price-desc") sortOptions = { price: -1 };
  else if (sort === "newest") sortOptions = { createdAt: -1 };
  else if (sort === "popular") sortOptions = { salesCount: -1 };

  const [products, total, categories] = await Promise.all([
    Product.find(query)
      .populate("category", "name slug")
      .sort(sortOptions)
      .lean(),
    Product.countDocuments(query),
    Category.find({ isActive: true }).sort({ displayOrder: 1 }).lean(),
  ]);

  return (
    <ShopClient
      initialProducts={JSON.parse(JSON.stringify(products))}
      categories={JSON.parse(JSON.stringify(categories))}
      totalProducts={total}
      currentCategory={categorySlug || "all"}
      currentSort={sort}
      currentSearch={search}
    />
  );
}
