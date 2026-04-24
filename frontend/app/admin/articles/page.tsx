"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function getToken() { return localStorage.getItem("24ghanta_admin_token") || ""; }

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(page = 1) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (catFilter) params.set("category_id", catFilter);
    try {
      const res = await fetch(`${API}/api/admin/articles?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) { const d = await res.json(); setArticles(d.data); setPagination(d.pagination); }
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => {
    fetch(`${API}/api/admin/categories`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.ok ? r.json() : []).then(setCategories).catch(() => {});
    load();
  }, []);

  useEffect(() => { load(1); }, [search, statusFilter, catFilter]);

  async function togglePublish(id: number) {
    await fetch(`${API}/api/admin/articles/${id}/toggle`, { method: "PATCH", headers: { Authorization: `Bearer ${getToken()}` } });
    load(pagination.page);
  }

  async function deleteArticle(id: number) {
    if (!confirm("Delete this article?")) return;
    await fetch(`${API}/api/admin/articles/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    load(pagination.page);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Articles</h1><p className="text-sm text-gray-500 mt-1">{pagination.total} total articles</p></div>
        <Link href="/admin/articles/new" className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all"><Plus className="w-4 h-4" /> New Article</Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..." className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20">
            <option value="all">All Status</option><option value="published">Published</option><option value="draft">Drafts</option>
          </select>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20">
            <option value="">All Categories</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {loading ? <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mx-auto" /></div> :
        articles.length === 0 ? <p className="py-16 text-center text-gray-400">No articles found.</p> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left py-3 px-3 text-gray-500 font-medium">Title</th>
              <th className="text-left py-3 px-3 text-gray-500 font-medium">Category</th>
              <th className="text-left py-3 px-3 text-gray-500 font-medium">Author</th>
              <th className="text-left py-3 px-3 text-gray-500 font-medium">Status</th>
              <th className="text-left py-3 px-3 text-gray-500 font-medium">Views</th>
              <th className="text-right py-3 px-3 text-gray-500 font-medium">Actions</th>
            </tr></thead>
            <tbody>{articles.map(a => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-3 px-3"><Link href={`/admin/articles/${a.id}`} className="font-medium text-gray-900 hover:text-red-600 transition-colors line-clamp-1">{a.title}</Link></td>
                <td className="py-3 px-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.category_name || "—"}</span></td>
                <td className="py-3 px-3 text-gray-600">{a.author_name || "—"}</td>
                <td className="py-3 px-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.is_published ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>{a.is_published ? "Published" : "Draft"}</span></td>
                <td className="py-3 px-3 text-gray-600">{a.views || 0}</td>
                <td className="py-3 px-3"><div className="flex items-center justify-end gap-1">
                  <div className="flex items-center px-2" title={a.is_published ? "Unpublish" : "Publish"}>
                    <ToggleSwitch checked={a.is_published} onChange={() => togglePublish(a.id)} />
                  </div>
                  <Link href={`/admin/articles/${a.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><Pencil className="w-4 h-4 text-blue-600" /></Link>
                  <button onClick={() => deleteArticle(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
