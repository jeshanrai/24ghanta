"use client";
import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Check, Search, Hash, Globe, Info, AlertCircle, Loader2 } from "lucide-react";
import { confirmAction } from "@/components/ui/ConfirmDialog";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function getToken() { return localStorage.getItem("24ghanta_admin_token") || ""; }
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").trim(); }

export default function CategoriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", color: "", meta_title: "", meta_description: "", meta_keywords: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/categories`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setItems(await res.json());
    } catch (e) {} finally { setLoading(false); }
  }
  
  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(s) || i.slug.toLowerCase().includes(s));
  }, [items, search]);

  function startEdit(item: any) { 
    setEditing(item); 
    setForm({ 
      name: item.name, 
      slug: item.slug, 
      color: item.color || "#ef4444", 
      meta_title: item.meta_title || "", 
      meta_description: item.meta_description || "",
      meta_keywords: item.meta_keywords || ""
    }); 
    setError("");
    setShowModal(true);
  }
  
  function startNew() { 
    setEditing(null); 
    setForm({ name: "", slug: "", color: "#ef4444", meta_title: "", meta_description: "", meta_keywords: "" }); 
    setError("");
    setShowModal(true);
  }
  
  async function handleSave() {
    setError("");
    const body = { ...form, slug: form.slug || slugify(form.name) };
    if (!body.name) { setError("Name is required"); return; }
    
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/categories${editing ? `/${editing.id}` : ""}`, { 
        method: editing ? "PUT" : "POST", 
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, 
        body: JSON.stringify(body) 
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowModal(false);
      load();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }

  async function remove(id: number) {
    const category = items.find(c => c.id === id);
    const count = category?.article_count || 0;
    const ok = await confirmAction({
      title: "Delete category?",
      message: (
        <div className="space-y-2">
          <p>This will permanently delete <span className="font-semibold text-gray-900">{category?.name}</span>.</p>
          {count > 0 && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg text-orange-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Warning: This category is linked to <span className="font-bold">{count}</span> article(s). They will be left without a category.</p>
            </div>
          )}
        </div>
      ),
      confirmLabel: "Delete Category",
      variant: "danger",
    });
    if (!ok) return;
    await fetch(`${API}/api/admin/categories/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    load();
  }

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Categories</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            Manage article classification and navigation
          </p>
        </div>
        <button 
          onClick={startNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all shadow-md shadow-red-100 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {/* Stats and Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or slug..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all"
          />
        </div>
        <div className="bg-white border border-gray-100 px-4 py-2.5 rounded-xl flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</span>
          <span className="text-lg font-bold text-gray-900">{items.length}</span>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin mx-auto mb-4 opacity-20" />
            <p className="text-sm text-gray-400">Loading categories...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No categories found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
              {search ? `No matches for "${search}". Try a different search term.` : "Start by creating your first category to organize your articles."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Category Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Articles</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">SEO</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm ring-2 ring-white" 
                          style={{ backgroundColor: item.color || "#ef4444" }} 
                        />
                        <span className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">/{item.slug}</code>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700">
                        {item.article_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {item.meta_title && item.meta_description ? (
                          <div title="SEO Complete" className="text-green-500 bg-green-50 p-1 rounded-lg">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <div title="SEO Missing" className="text-gray-300 bg-gray-50 p-1 rounded-lg">
                            <Globe className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEdit(item)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Category"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => remove(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Edit/New */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !saving && setShowModal(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit Category" : "New Category"}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{editing ? `Updating category ID: ${editing.id}` : "Fill in the details to create a new category"}</p>
              </div>
              <button 
                onClick={() => !saving && setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Basic Info Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <Info className="w-3 h-3" />
                  Basic Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Display Name <span className="text-red-500">*</span></label>
                    <input 
                      autoFocus
                      value={form.name} 
                      onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: f.slug === slugify(f.name) || !f.slug ? slugify(e.target.value) : f.slug }))}
                      placeholder="e.g. World News"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Slug</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
                      <input 
                        value={form.slug} 
                        onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                        placeholder="category-slug"
                        className="w-full pl-7 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Category Color Accent</label>
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      <input 
                        type="color" 
                        value={form.color || "#ef4444"} 
                        onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                        className="w-12 h-12 rounded-xl cursor-pointer border-4 border-white shadow-sm ring-1 ring-gray-200 overflow-hidden"
                      />
                      <div className="absolute inset-0 rounded-xl pointer-events-none group-hover:bg-black/5 transition-colors" />
                    </div>
                    <div className="flex-1 relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        value={form.color} 
                        onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                        placeholder="#HEX-COLOR"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all uppercase"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">This color will be used for labels and accents on the frontend.</p>
                </div>
              </div>

              <hr className="border-gray-50" />

              {/* SEO Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <Globe className="w-3 h-3" />
                  SEO Optimization
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Meta Title</label>
                    <input 
                      value={form.meta_title} 
                      onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                      placeholder="Title tag for search results"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Meta Description</label>
                    <textarea 
                      value={form.meta_description} 
                      onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                      rows={2}
                      placeholder="Brief summary for search engine snippets"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Meta Keywords</label>
                    <input 
                      value={form.meta_keywords} 
                      onChange={e => setForm(f => ({ ...f, meta_keywords: e.target.value }))}
                      placeholder="e.g. news, politics, world (comma separated)"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editing ? "Save Changes" : "Create Category"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
