import dbConnect from "@/lib/db";
import { Product, Category } from "@/lib/models";
import ProductsClient from "./ProductsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory & Products Management | allinonepermium Admin",
};

export const revalidate = 0; // Dynamic admin data

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search = "" } = await searchParams;
  await dbConnect();

  const [products, categories] = await Promise.all([
    Product.find().populate("category", "name slug").sort({ createdAt: -1 }).lean(),
    Category.find().sort({ displayOrder: 1, name: 1 }).lean(),
  ]);

  return (
    <ProductsClient
      key={search}
      initialSearch={search}
      initialProducts={JSON.parse(JSON.stringify(products))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
