"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Eye,
  MoreVertical,
  Trash2,
  X,
  Layers,
  Box,
  Package,
  Tag,
  ShoppingCart,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  FolderOpen,
} from "lucide-react";
import { toast } from "@/lib/store/toastStore";
import { ICategory } from "@/types";
import { PageHeader, StatCard, StatusPill, adminInput, primaryButton, secondaryButton } from "@/components/admin/ui";

type Row = ICategory & { itemCount?: number };
type SortKey = "order" | "name-asc" | "name-desc" | "items";

const sortLabels: Record<SortKey, string> = {
  order: "Display order",
  "name-asc": "Name (A-Z)",
  "name-desc": "Name (Z-A)",
  items: "Most products",
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  image: { url: "", alt: "" } as { url: string; alt?: string },
  displayOrder: 0,
  isActive: true,
};

export default function CategoriesClient({
  initialCategories,
  stats,
}: {
  initialCategories: Row[];
  stats: { totalProducts: number; newCategories: number; newProducts: number };
}) {
  const [categories, setCategories] = useState<Row[]>(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Row | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<SortKey>("order");
  const [view, setView] = useState<"list" | "grid">("list");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenu]);

  const total = categories.length;
  const active = categories.filter((c) => c.isActive).length;
  const inactive = total - active;
  const pct = (n: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : "0%");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = categories.filter(
      (c) =>
        (statusFilter === "all" || (statusFilter === "active" ? c.isActive : !c.isActive)) &&
        (!q || c.name.toLowerCase().includes(q) || c.slug.includes(q) || (c.description || "").toLowerCase().includes(q))
    );
    return [...rows].sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      if (sort === "items") return (b.itemCount ?? 0) - (a.itemCount ?? 0);
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
  }, [categories, query, statusFilter, sort]);

  const openAdd = () => {
    setEditingCategory(null);
    setForm({ ...emptyForm, displayOrder: categories.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (cat: Row) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      image: cat.image || { url: "", alt: "" },
      displayOrder: cat.displayOrder || 0,
      isActive: cat.isActive !== undefined ? cat.isActive : true,
    });
    setOpenMenu(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory._id}` : "/api/admin/categories";
      const res = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to save category");

      toast.success(editingCategory ? "Category updated" : "Category created", `${form.name} saved successfully.`);

      // Reload the list but keep product counts, which the list endpoint doesn't return.
      const listData = await (await fetch("/api/admin/categories")).json();
      if (listData.categories) {
        const counts = new Map(categories.map((c) => [c._id, c.itemCount ?? 0]));
        setCategories((listData.categories as Row[]).map((c) => ({ ...c, itemCount: counts.get(c._id) ?? 0 })));
      }
      setModalOpen(false);
    } catch (err) {
      toast.error("Save failed", (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: Row) => {
    setOpenMenu(null);
    if ((cat.itemCount ?? 0) > 0) {
      toast.error("Category in use", `Move or delete the ${cat.itemCount} product(s) in "${cat.name}" first.`);
      return;
    }
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${cat._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete");
      toast.success("Category deleted", `${cat.name} has been removed.`);
      setCategories((prev) => prev.filter((c) => c._id !== cat._id));
    } catch (err) {
      toast.error("Delete failed", (err as Error).message);
    }
  };

  const toggleActive = async (cat: Row) => {
    setOpenMenu(null);
    try {
      const res = await fetch(`/api/admin/categories/${cat._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update");
      setCategories((prev) => prev.map((c) => (c._id === cat._id ? { ...c, isActive: !cat.isActive } : c)));
      toast.success(cat.isActive ? "Category hidden" : "Category activated", cat.name);
    } catch (err) {
      toast.error("Update failed", (err as Error).message);
    }
  };

  const actions = (cat: Row) => (
    <div className="flex items-center justify-end gap-1.5">
      <button onClick={() => openEdit(cat)} className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center" title="Edit" aria-label={`Edit ${cat.name}`}>
        <Pencil className="h-4 w-4" />
      </button>
      <a
        href={`/shop?category=${cat.slug}`}
        target="_blank"
        rel="noopener"
        className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center"
        title="View in store"
        aria-label={`View ${cat.name} in store`}
      >
        <Eye className="h-4 w-4" />
      </a>
      <div className="relative" ref={openMenu === cat._id ? menuRef : undefined}>
        <button
          onClick={() => setOpenMenu(openMenu === cat._id ? null : cat._id!)}
          className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center"
          aria-label={`More actions for ${cat.name}`}
          aria-haspopup="menu"
          aria-expanded={openMenu === cat._id}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {openMenu === cat._id && (
          <div role="menu" className="absolute right-0 z-20 mt-1 w-44 rounded-xl bg-white border border-slate-200 shadow-xl py-1 text-[13px] text-left">
            <button role="menuitem" onClick={() => toggleActive(cat)} className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 text-left">
              {cat.isActive ? "Hide from store" : "Activate"}
            </button>
            <button role="menuitem" onClick={() => handleDelete(cat)} className="w-full px-3.5 py-2 text-rose-600 hover:bg-rose-50 text-left flex items-center gap-2">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const thumb = (cat: Row, size: string) => (
    <span className={`relative ${size} shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200`}>
      {cat.image?.url ? (
        <Image src={cat.image.url} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        <Layers className="absolute inset-0 m-auto h-5 w-5 text-slate-400" />
      )}
    </span>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Layers}
        eyebrow="Categories"
        title="Store Categories"
        description="Organize customer navigation, display order, and category banners."
        actions={
          <button onClick={openAdd} className={primaryButton}>
            <Plus className="h-5 w-5" /> Create Category
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Box} tone="blue" label="Total Categories" value={total} trend={stats.newCategories > 0 ? `+${stats.newCategories} this week` : undefined} />
        <StatCard icon={Package} tone="green" label="Total Products" value={stats.totalProducts} trend={stats.newProducts > 0 ? `+${stats.newProducts} this week` : undefined} />
        <StatCard icon={Tag} tone="violet" label="Active Categories" value={active} note={<><span className="font-semibold text-blue-600">{pct(active)}</span> of total</>} />
        <StatCard icon={ShoppingCart} tone="orange" label="Inactive Categories" value={inactive} note={`${pct(inactive)} of total`} />
      </div>

      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-5">
          <h2 className="flex items-center gap-3 text-[18px] font-bold text-slate-900 mr-auto">
            <Layers className="h-6 w-6" strokeWidth={1.8} /> Store Categories
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search categories…" aria-label="Search categories" className={`${adminInput} w-56 pl-9`} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} aria-label="Filter by status" className={`${adminInput} pr-8`}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" aria-hidden="true" />
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort categories" className={`${adminInput} pl-9 pr-8`}>
                {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    Sort by: {sortLabels[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex h-10 rounded-xl border border-slate-200 p-0.5" role="group" aria-label="View">
              {(["grid", "list"] as const).map((v) => {
                const Icon = v === "grid" ? LayoutGrid : List;
                return (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    aria-label={`${v} view`}
                    className={`w-9 rounded-lg flex items-center justify-center ${view === v ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-700"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="px-5 pb-12 pt-6 text-center">
            <FolderOpen className="h-10 w-10 mx-auto text-slate-300" strokeWidth={1.5} />
            <p className="mt-3 font-semibold text-slate-800">{total === 0 ? "No categories yet" : "No categories match your filters"}</p>
            <p className="text-[13px] text-slate-500 mt-1">
              {total === 0 ? "Create your first category to organize the store." : "Try a different search or status."}
            </p>
            {total === 0 && (
              <button onClick={openAdd} className={`${primaryButton} mt-5`}>
                <Plus className="h-5 w-5" /> Create Category
              </button>
            )}
          </div>
        ) : view === "list" ? (
          <div className="px-5 pb-5 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[14px]">
              <thead>
                <tr className="bg-slate-50 text-[12px] font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="py-3.5 px-4 rounded-l-xl w-14">#</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Assigned items</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-700 tabular-nums">#{cat.displayOrder}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3.5">
                        {thumb(cat, "h-12 w-12")}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{cat.name}</p>
                          {cat.description && <p className="text-[13px] text-slate-500 line-clamp-1 max-w-sm">{cat.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[13px] text-slate-600">{cat.slug}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex h-7 items-center px-3 rounded-full bg-slate-100 text-[12px] font-semibold text-slate-700 tabular-nums">
                        {cat.itemCount ?? 0} {cat.itemCount === 1 ? "product" : "products"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill tone={cat.isActive ? "green" : "slate"}>{cat.isActive ? "Active" : "Inactive"}</StatusPill>
                    </td>
                    <td className="py-3 px-4">{actions(cat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((cat) => (
              <div key={cat._id} className="rounded-xl border border-slate-200 p-4 flex gap-4">
                {thumb(cat, "h-20 w-20")}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 truncate">{cat.name}</p>
                    <span className="text-[12px] text-slate-400 tabular-nums">#{cat.displayOrder}</span>
                  </div>
                  <p className="text-[13px] text-slate-500 line-clamp-2 mt-0.5">{cat.description || cat.slug}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <StatusPill tone={cat.isActive ? "green" : "slate"}>{cat.isActive ? "Active" : "Inactive"}</StatusPill>
                    {actions(cat)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cat-modal-title">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 id="cat-modal-title" className="text-[18px] font-bold text-slate-900">
                {editingCategory ? "Edit Category" : "Create Category"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-[14px]">
              <div>
                <label htmlFor="cat-name" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Category name</label>
                <input id="cat-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Adapters & Chargers" className={`${adminInput} w-full`} />
              </div>
              <div>
                <label htmlFor="cat-slug" className="block text-[13px] font-semibold text-slate-700 mb-1.5">URL slug <span className="font-normal text-slate-400">(optional)</span></label>
                <input id="cat-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="adapters-and-chargers" className={`${adminInput} w-full font-mono`} />
              </div>
              <div>
                <label htmlFor="cat-desc" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Short description</label>
                <input id="cat-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Shown on the homepage banners" className={`${adminInput} w-full`} />
              </div>
              <div>
                <label htmlFor="cat-img" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Banner image URL</label>
                <input id="cat-img" type="url" value={form.image.url} onChange={(e) => setForm({ ...form, image: { ...form.image, url: e.target.value } })} placeholder="https://…" className={`${adminInput} w-full`} />
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label htmlFor="cat-order" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Display order</label>
                  <input id="cat-order" type="number" min={0} value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className={`${adminInput} w-full tabular-nums`} />
                </div>
                <label className="flex items-center gap-2.5 h-10 cursor-pointer text-slate-700">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded accent-blue-600" />
                  Show in store menu
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className={secondaryButton}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className={primaryButton}>
                  {isSaving ? "Saving…" : editingCategory ? "Save changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
