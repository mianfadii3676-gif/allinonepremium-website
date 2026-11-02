import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import { Product } from "@/lib/models";
import ProductDetailClient from "./ProductDetailClient";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await dbConnect();
  const { slug } = await params;
  const product = await Product.findOne({ slug, isPublished: true }).lean();

  if (!product) {
    return { title: "Product Not Found | allinonepermium" };
  }

  return {
    title: `${product.name} — Rs. ${product.price.toLocaleString()} | allinonepermium`,
    description: product.description?.slice(0, 160) || "Premium mobile accessories in Pakistan.",
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images?.[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export const revalidate = 60;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await dbConnect();
  const { slug } = await params;

  const product = await Product.findOne({ slug, isPublished: true })
    .populate("category", "name slug")
    .lean();

  if (!product) {
    notFound();
  }

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isPublished: true,
  })
    .limit(4)
    .populate("category", "name slug")
    .lean();

  return (
    <ProductDetailClient
      product={JSON.parse(JSON.stringify(product))}
      relatedProducts={JSON.parse(JSON.stringify(related))}
    />
  );
}
