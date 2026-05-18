"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  Hash,
  Info,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { confirmAction } from "@/components/ui/ConfirmDialog";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function getToken() { return localStorage.getItem("24ghanta_admin_token") || ""; }
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").trim(); }

interface Category {
  id: number;
  name: string;
  slug: string;
  color?: string | null;
  parent_id: number | null;
  article_count?: number;
}

interface PanelArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
  is_published: boolean;
  is_featured: boolean;
  is_breaking: boolean;
  category_id: number | null;
  category_name: string | null;
  author_name: string | null;
}

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", color: "#ef4444", parent_id: "" as string });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // Roots expanded by default; user can collapse. Persists in-session only.
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Right-pane state: which category's articles are being shown.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [panelArticles, setPanelArticles] = useState<PanelArticle[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelSearch, setPanelSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/categories`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) {
        const data: Category[] = await res.json();
        setItems(data);
        // Expand all roots by default so the user can see structure immediately.
        setExpanded((prev) => {
          if (prev.size > 0) return prev;
          const next = new Set<number>();
          for (const c of data) if (c.parent_id === null) next.add(c.id);
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Fetch the right-pane article list whenever the selected category changes
  // or the in-panel search debounces. The endpoint already includes
  // descendants, so selecting "Education" returns Education + University +
  // Course articles in one call.
  useEffect(() => {
    if (selectedId == null) {
      setPanelArticles([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setPanelLoading(true);
      try {
        const params = new URLSearchParams();
        if (panelSearch.trim()) params.set("search", panelSearch.trim());
        params.set("limit", "100");
        const res = await fetch(
          `${API}/api/admin/categories/${selectedId}/articles?${params.toString()}`,
          { headers: { Authorization: `Bearer ${getToken()}` }, signal: controller.signal }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPanelArticles(data.data || []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setPanelArticles([]);
      } finally {
        setPanelLoading(false);
      }
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [selectedId, panelSearch]);

  /* ── tree helpers ─────────────────────────────────────── */

  const itemsById = useMemo(() => {
    const m = new Map<number, Category>();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  // Children grouped by parent_id, sorted alphabetically per branch.
  const childrenOf = useMemo(() => {
    const m = new Map<number | null, Category[]>();
    for (const it of items) {
      const key = it.parent_id ?? null;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(it);
    }
    for (const list of m.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return m;
  }, [items]);

  // Search bypasses the tree — show flat hit-list with breadcrumb path so the
  // user can find a deep category without expanding every parent.
  const searchHits = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return null;
    return items
      .filter((c) => c.name.toLowerCase().includes(s) || c.slug.toLowerCase().includes(s))
      .map((c) => ({ category: c, path: breadcrumbFor(c, itemsById) }))
      .sort((a, b) => a.category.name.localeCompare(b.category.name));
  }, [items, search, itemsById]);

  function toggleExpanded(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /* ── modal open/close ─────────────────────────────────── */

  function startEdit(item: Category) {
    setEditing(item);
    setForm({
      name: item.name,
      slug: item.slug,
      color: item.color || "#ef4444",
      parent_id: item.parent_id ? String(item.parent_id) : "",
    });
    setError("");
    setShowModal(true);
  }

  function startNew(parentId?: number) {
    setEditing(null);
    setForm({
      name: "",
      slug: "",
      color: "#ef4444",
      parent_id: parentId ? String(parentId) : "",
    });
    setError("");
    setShowModal(true);
  }

  /* ── save / delete ────────────────────────────────────── */

  async function handleSave() {
    setError("");
    const body = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      color: form.color || null,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
    };
    if (!body.name) { setError("Name is required"); return; }

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/categories${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      // If we just created a child, expand its parent so the new row is visible.
      if (!editing && body.parent_id) {
        setExpanded((prev) => new Set(prev).add(body.parent_id!));
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Category) {
    const hasChildren = (childrenOf.get(item.id) || []).length > 0;
    const articleCount = item.article_count || 0;
    const ok = await confirmAction({
      title: "Delete category?",
      message: (
        <div className="space-y-2">
          <p>This will permanently delete <span className="font-semibold text-gray-900">{item.name}</span>.</p>
          {hasChildren && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>This category has subcategories. Delete or move them first.</p>
            </div>
          )}
          {articleCount > 0 && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg text-orange-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{articleCount} article(s) are filed under this category. They will be left uncategorised.</p>
            </div>
          )}
        </div>
      ),
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    const res = await fetch(`${API}/api/admin/categories/${item.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Delete failed");
      return;
    }
    load();
  }

  /* ── render ───────────────────────────────────────────── */

  const roots = childrenOf.get(null) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organise articles into a tree. Click a category to see its articles on the right.
          </p>
        </div>
        <button
          type="button"
          onClick={() => startNew()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all shadow-md shadow-red-100 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New top-level category
        </button>
      </div>

      {/* Search + count */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or slug..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all"
          />
        </div>
        <div className="bg-white border border-gray-100 px-4 py-2.5 rounded-xl flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</span>
          <span className="text-lg font-bold text-gray-900">{items.length}</span>
        </div>
      </div>

      {/* Body: tree on the left, articles for selected category on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-10 h-10 text-red-600 animate-spin mx-auto mb-4 opacity-20" />
              <p className="text-sm text-gray-400">Loading categories...</p>
            </div>
          ) : items.length === 0 ? (
            <EmptyState />
          ) : searchHits ? (
            <SearchHits
              hits={searchHits}
              onEdit={startEdit}
              onDelete={remove}
              onSelect={setSelectedId}
              selectedId={selectedId}
            />
          ) : roots.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-gray-50">
              {roots.map((root) => (
                <TreeNode
                  key={root.id}
                  node={root}
                  depth={0}
                  childrenOf={childrenOf}
                  expanded={expanded}
                  selectedId={selectedId}
                  onToggle={toggleExpanded}
                  onSelect={setSelectedId}
                  onAddChild={(id) => startNew(id)}
                  onEdit={startEdit}
                  onDelete={remove}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <ArticlesPanel
            selected={selectedId != null ? itemsById.get(selectedId) ?? null : null}
            articles={panelArticles}
            loading={panelLoading}
            search={panelSearch}
            onSearchChange={setPanelSearch}
          />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          editing={editing}
          form={form}
          setForm={setForm}
          saving={saving}
          error={error}
          items={items}
          itemsById={itemsById}
          onClose={() => !saving && setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

/* ─── tree row ─────────────────────────────────────────── */

function TreeNode({
  node,
  depth,
  childrenOf,
  expanded,
  selectedId,
  onToggle,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: Category;
  depth: number;
  childrenOf: Map<number | null, Category[]>;
  expanded: Set<number>;
  selectedId: number | null;
  onToggle: (id: number) => void;
  onSelect: (id: number) => void;
  onAddChild: (parentId: number) => void;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  const kids = childrenOf.get(node.id) || [];
  const hasKids = kids.length > 0;
  const isOpen = expanded.has(node.id);
  const isSelected = selectedId === node.id;
  // No more depth cap — admins can nest arbitrarily, so every node can spawn children.

  return (
    <li>
      <div
        className={`group flex items-center gap-2 py-2.5 pr-3 transition-colors cursor-pointer ${
          isSelected ? "bg-red-50/70" : "hover:bg-gray-50/60"
        }`}
        style={{ paddingLeft: `${12 + depth * 24}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand/collapse chevron — invisible placeholder when no kids so rows align */}
        {hasKids ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
            className="p-1 -ml-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
            aria-label={isOpen ? "Collapse" : "Expand"}
            title={isOpen ? "Collapse" : "Expand"}
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-6" aria-hidden />
        )}

        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm"
          style={{ backgroundColor: node.color || "#ef4444" }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 truncate">{node.name}</span>
            <code className="text-[11px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              /{node.slug}
            </code>
          </div>
        </div>

        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 shrink-0">
          {node.article_count || 0}
        </span>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/category/${node.slug}`}
            target="_blank"
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="View on public site"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => onAddChild(node.id)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
            title="Add subcategory"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hasKids && isOpen && (
        <ul className="border-l border-gray-100 ml-[20px]">
          {kids.map((k) => (
            <TreeNode
              key={k.id}
              node={k}
              depth={depth + 1}
              childrenOf={childrenOf}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ─── search results (flat) ────────────────────────────── */

function SearchHits({
  hits,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
}: {
  hits: { category: Category; path: string }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  if (hits.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-gray-400">No categories match your search.</div>
    );
  }
  return (
    <ul className="divide-y divide-gray-50">
      {hits.map(({ category, path }) => {
        const isSelected = selectedId === category.id;
        return (
          <li
            key={category.id}
            className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
              isSelected ? "bg-red-50/70" : "hover:bg-gray-50/60"
            }`}
            onClick={() => onSelect(category.id)}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm"
              style={{ backgroundColor: category.color || "#ef4444" }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-400 truncate">{path}</div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 truncate">{category.name}</span>
                <code className="text-[11px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">/{category.slug}</code>
              </div>
            </div>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 shrink-0">
              {category.article_count || 0}
            </span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <Link href={`/category/${category.slug}`} target="_blank" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="View on public site">
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <button type="button" onClick={() => onEdit(category)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                <Pencil className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => onDelete(category)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ─── modal ────────────────────────────────────────────── */

function Modal({
  editing,
  form,
  setForm,
  saving,
  error,
  items,
  itemsById,
  onClose,
  onSave,
}: {
  editing: Category | null;
  form: { name: string; slug: string; color: string; parent_id: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; slug: string; color: string; parent_id: string }>>;
  saving: boolean;
  error: string;
  items: Category[];
  itemsById: Map<number, Category>;
  onClose: () => void;
  onSave: () => void;
}) {
  // Filter out self and any descendant from the parent dropdown to prevent
  // selecting a cycle in the UI (backend also rejects, but this is friendlier).
  const descendantIds = useMemo(() => {
    if (!editing) return new Set<number>();
    const ids = new Set<number>([editing.id]);
    let added = true;
    while (added) {
      added = false;
      for (const it of items) {
        if (it.parent_id !== null && ids.has(it.parent_id) && !ids.has(it.id)) {
          ids.add(it.id);
          added = true;
        }
      }
    }
    return ids;
  }, [editing, items]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit Category" : "New Category"}</h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <Info className="w-3 h-3" />
            Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Display Name <span className="text-red-500">*</span></label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: f.slug === slugify(f.name) || !f.slug ? slugify(e.target.value) : f.slug,
                  }))
                }
                placeholder="e.g. University"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Slug</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="category-slug"
                  className="w-full pl-7 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Parent</label>
            <select
              title="Parent category"
              value={form.parent_id}
              onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all"
            >
              <option value="">— None (top-level) —</option>
              {items
                .filter((c) => !descendantIds.has(c.id))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {breadcrumbFor(c, itemsById)}
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-gray-400">Nest as deep as you need (e.g. Education › University › Course › Year 1 ...).</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Accent Colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                title="Pick a colour"
                value={form.color || "#ef4444"}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="w-12 h-12 rounded-xl cursor-pointer border-4 border-white shadow-sm ring-1 ring-gray-200"
              />
              <div className="flex-1 relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  placeholder="#HEX-COLOR"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 disabled:opacity-50">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> {editing ? "Save Changes" : "Create Category"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── shared utils ─────────────────────────────────────── */

function breadcrumbFor(c: Category, itemsById: Map<number, Category>): string {
  const parts: string[] = [c.name];
  let cursor: Category | undefined = c;
  // Bound the walk so a corrupted parent chain can't spin forever.
  for (let i = 0; i < 5; i++) {
    if (!cursor?.parent_id) break;
    const parent = itemsById.get(cursor.parent_id);
    if (!parent) break;
    parts.unshift(parent.name);
    cursor = parent;
  }
  return parts.join(" › ");
}

/* ─── right-hand articles panel ────────────────────────── */

function ArticlesPanel({
  selected,
  articles,
  loading,
  search,
  onSearchChange,
}: {
  selected: Category | null;
  articles: PanelArticle[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  if (!selected) {
    return (
      <div className="py-24 text-center px-4">
        <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-500 font-medium">Select a category</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
          Click any category on the left to see all the articles filed under it (including its subcategories).
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm"
            style={{ backgroundColor: selected.color || "#ef4444" }}
          />
          <h2 className="font-bold text-gray-900 truncate">{selected.name}</h2>
          <code className="text-[11px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
            /{selected.slug}
          </code>
          <span className="text-[11px] text-gray-400 ml-auto">
            {loading ? "loading…" : `${articles.length} article${articles.length === 1 ? "" : "s"}`}
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search within this category…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
          />
        </div>
      </div>

      <div className="overflow-y-auto max-h-[600px]">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin mx-auto" />
          </div>
        ) : articles.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            {search ? "No articles match your search." : "No articles in this category yet."}
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {articles.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/admin/articles/${a.id}`}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors"
                >
                  {a.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.image_url}
                      alt=""
                      className="w-14 h-14 object-cover rounded-lg shrink-0 bg-gray-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{a.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                      {a.category_name && a.category_id !== selected.id && (
                        <span className="px-1.5 py-0.5 rounded-full bg-gray-100">
                          {a.category_name}
                        </span>
                      )}
                      {a.is_breaking && (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold">
                          Breaking
                        </span>
                      )}
                      {a.is_featured && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold">
                          Featured
                        </span>
                      )}
                      {!a.is_published && (
                        <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          Draft
                        </span>
                      )}
                      {a.author_name && <span>by {a.author_name}</span>}
                      {a.published_at && (
                        <span>
                          {new Date(a.published_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-24 text-center px-4">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <FolderPlus className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">No categories yet</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
        Start with a top-level category like &ldquo;Education&rdquo;, then add subcategories beneath it.
      </p>
    </div>
  );
}
