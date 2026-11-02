import { MetadataRoute } from "next";
import dbConnect from "@/lib/db";
import { Product, Category } from "@/lib/models";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://allinonepremium.store";

  await dbConnect();
  const [products, categories] = await Promise.all([
    Product.find({ isPublished: true }).select("slug updatedAt").lean(),
    Category.find({ isActive: true }).select("slug updatedAt").lean(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), priority: 1.0, changeFrequency: "daily" },
    { url: `${siteUrl}/shop`, lastModified: new Date(), priority: 0.9, changeFrequency: "daily" },
    { url: `${siteUrl}/contact`, lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" },
    { url: `${siteUrl}/policies`, lastModified: new Date(), priority: 0.5, changeFrequency: "monthly" },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteUrl}/products/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    priority: 0.8,
    changeFrequency: "weekly",
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteUrl}/shop?category=${c.slug}`,
    lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
    priority: 0.7,
    changeFrequency: "weekly",
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
