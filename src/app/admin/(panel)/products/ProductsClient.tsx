"use client";

import { Package as HeaderIcon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Check,
  X,
  Upload,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/lib/store/toastStore";
import { IProduct, ICategory } from "@/types";

export default function ProductsClient({
  initialProducts,
  initialSearch = "",
  categories,
}: {
  initialSearch?: string;
  initialProducts: IProduct[];
  categories: ICategory[];
}) {
  const [products, setProducts] = useState<IProduct[]>(initialProducts);
  const [search, setSearch] = useState(initialSearch);
  const [filterStock, setFilterStock] = useState<"all" | "in" | "low" | "out">("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    slug: "",
    sku: "",
    description: "",
    category: "",
    price: 0,
    originalPrice: 0,
    costPrice: 0,
    stock: 0,
    images: [{ url: "", alt: "" }],
    variants: [{ name: "Color", value: "Default", stock: 10, priceModifier: 0 }],
    specifications: [{ key: "Warranty", value: "7-Day Replacement" }],
    isFeatured: false,
    isNewArrival: false,
    isPublished: true,
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({
      name: "",
      slug: "",
      sku: "",
      description: "",
      category: categories[0]?._id || "",
      price: 2999,
      originalPrice: 3499,
      costPrice: 1500,
      stock: 20,
      images: [{ url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80", alt: "Product Photo" }],
      variants: [{ name: "Color", value: "Black", stock: 20, priceModifier: 0 }],
      specifications: [{ key: "Condition", value: "Brand New Sealed" }],
      isFeatured: false,
      isNewArrival: true,
      isPublished: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (p: IProduct) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: p.description || "",
      category: typeof p.category === "object" ? (p.category as any)?._id : p.category || "",
      price: p.price,
      originalPrice: p.originalPrice || 0,
      costPrice: p.costPrice || 0,
      stock: p.stock,
      images:
        p.images && p.images.length > 0
          ? p.images.map((image) => ({ url: image.url, alt: image.alt || "" }))
          : [{ url: "", alt: "" }],
      variants:
        p.variants && p.variants.length > 0
          ? p.variants.map((variant) => ({
              name: variant.name,
              value: variant.value,
              stock: variant.stock,
              priceModifier: variant.priceModifier || 0,
            }))
          : [],
      specifications: p.specifications && p.specifications.length > 0 ? p.specifications : [],
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      isPublished: p.isPublished,
    });
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct._id}`
        : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save product");
      }

      toast.success(
        editingProduct ? "Product Updated" : "Product Created",
        `${form.name} saved successfully.`
      );

      // Refresh list
      const fetchList = await fetch("/api/admin/products");
      const listData = await fetchList.json();
      if (listData.products) setProducts(listData.products);

      setModalOpen(false);
    } catch (err: any) {
      toast.error("Save Error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete");

      toast.success("Product Deleted", `${name} removed from inventory.`);
      setProducts(products.filter((p) => p._id !== id));
    } catch (err: any) {
      toast.error("Delete Failed", err.message);
    }
  };

  const handleTogglePublish = async (p: IProduct) => {
    try {
      const nextStatus = !p.isPublished;
      const res = await fetch(`/api/admin/products/${p._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: nextStatus }),
      });
      if (res.ok) {
        setProducts(
          products.map((item) => (item._id === p._id ? { ...item, isPublished: nextStatus } : item))
        );
        toast.info("Status Updated", `Product is now ${nextStatus ? "Published" : "Hidden"}.`);
      }
    } catch {
      toast.error("Update Failed", "Could not change status.");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    const catId = typeof p.category === "object" ? (p.category as any)?._id : p.category;
    const matchesCategory = selectedCategory === "all" || catId === selectedCategory;

    let matchesStock = true;
    if (filterStock === "out") matchesStock = p.stock <= 0;
    else if (filterStock === "low") matchesStock = p.stock > 0 && p.stock <= 5;
    else if (filterStock === "in") matchesStock = p.stock > 5;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex h-16 w-16 shrink-0 rounded-2xl bg-blue-50 text-blue-600 items-center justify-center">
            <HeaderIcon className="h-8 w-8" strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-[12px] font-semibold tracking-wide text-blue-600 uppercase">Products</p>
            <h1 className="text-[26px] sm:text-[30px] leading-tight font-bold text-slate-900">Inventory & Products</h1>
            <p className="mt-0.5 text-[14px] text-slate-500">Manage catalogue, specifications, prices, multi-image assets, and stock levels.</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterStock("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStock === "all" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All Stock
            </button>
            <button
              onClick={() => setFilterStock("in")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStock === "in" ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setFilterStock("low")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStock === "low" ? "bg-amber-600 text-slate-900" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Low Stock (≤5)
            </button>
            <button
              onClick={() => setFilterStock("out")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStock === "out" ? "bg-rose-600 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        <span className="text-xs text-slate-500 tabular-nums">
          Showing {filteredProducts.length} of {products.length} products
        </span>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 tabular-nums border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredProducts.map((p) => {
                const img = p.images?.[0]?.url || "/placeholder.svg";
                const catName =
                  typeof p.category === "object" ? (p.category as any)?.name : "General";

                return (
                  <tr key={p._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0">
                          <Image src={img} alt={p.name} fill sizes="48px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-xs">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.isFeatured && (
                              <span className="text-[10px] text-blue-700 font-bold">Featured</span>
                            )}
                            {p.isNewArrival && (
                              <span className="text-[10px] text-emerald-700 font-bold">New</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 tabular-nums text-slate-500">{p.sku}</td>
                    <td className="py-3 px-4 text-slate-700">{catName}</td>

                    <td className="py-3 px-4 tabular-nums font-bold text-slate-900">
                      Rs. {p.price.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      {p.stock <= 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          0 (Out)
                        </span>
                      ) : p.stock <= 5 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {p.stock} (Low)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.stock} units
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleTogglePublish(p)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          p.isPublished
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {p.isPublished ? "Published" : "Hidden"}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="Preview in Storefront"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-800 hover:bg-slate-100 transition"
                          title="Edit Product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p._id!, p.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-slate-100 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-sm my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. GaN 65W Fast Charger"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">SKU (Stock Keeping Unit)</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. AOP-PWR-001"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 tabular-nums focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 tabular-nums focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Compare At Price (Strike-through)</label>
                  <input
                    type="number"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 tabular-nums focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 tabular-nums focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed technical specifications, benefits, warranty info..."
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Primary Product Image URL</label>
                <input
                  type="url"
                  value={form.images[0]?.url || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      images: [{ url: e.target.value, alt: form.name }],
                    })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="rounded bg-slate-100 border-slate-200 text-blue-700 focus:ring-0"
                  />
                  <span>Featured on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isNewArrival}
                    onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                    className="rounded bg-slate-100 border-slate-200 text-blue-700 focus:ring-0"
                  />
                  <span>New Arrival Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    className="rounded bg-slate-100 border-slate-200 text-blue-700 focus:ring-0"
                  />
                  <span>Published (Visible to Customers)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
