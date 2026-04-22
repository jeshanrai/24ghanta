"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, TrendingUp, Eye, ArrowUpRight, Plus, Video, BarChart3, Tag, UserPen, Clock } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("24ghanta_admin_token");
    if (!token) return;
    fetch(`${API}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => { if (d) setData(d); }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" /></div>;

  const s = data || { articles: { total: 0, published: 0, drafts: 0, totalViews: 0 }, videos: { total: 0 }, categories: { total: 0 }, tags: { total: 0 }, authors: { total: 0 }, recentArticles: [], topCategories: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Dashboard</h1><p className="text-sm text-gray-500 mt-1">Overview of your CMS</p></div>
        <Link href="/admin/articles/new" className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all"><Plus className="w-4 h-4" /> New Article</Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { href: "/admin/articles", icon: FileText, color: "blue", label: "Articles", value: s.articles.total, sub: `${s.articles.published} published` },
          { href: "/admin/articles", icon: Eye, color: "purple", label: "Total Views", value: s.articles.totalViews?.toLocaleString() || 0, sub: "All time" },
          { href: "/admin/videos", icon: Video, color: "red", label: "Videos", value: s.videos.total, sub: "Multimedia" },
          { href: "/admin/categories", icon: BarChart3, color: "green", label: "Categories", value: s.categories.total, sub: "Sections" },
          { href: "/admin/tags", icon: Tag, color: "orange", label: "Tags", value: s.tags.total, sub: "SEO tags" },
          { href: "/admin/authors", icon: UserPen, color: "indigo", label: "Authors", value: s.authors.total, sub: "Writers" },
        ].map((c) => (
          <Link key={c.label} href={c.href} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${c.color}-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <c.icon className={`w-5 h-5 text-${c.color}-600`} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
            <p className="text-[10px] text-green-600 font-medium mt-2">{c.sub}</p>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Articles</h3>
            <Link href="/admin/articles" className="text-xs text-red-600 font-medium hover:underline">View all →</Link>
          </div>
          {s.recentArticles.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">No articles yet. Create your first one!</p> :
            <div className="space-y-3">{s.recentArticles.map((a: any) => (
              <Link href={`/admin/articles/${a.id}`} key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 group">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 font-medium truncate group-hover:text-red-600 transition-colors">{a.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.category_name && <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{a.category_name}</span>}
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{a.published_at ? new Date(a.published_at).toLocaleDateString() : 'Draft'}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${a.is_published ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>{a.is_published ? "Live" : "Draft"}</span>
              </Link>
            ))}</div>
          }
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Top Categories</h3>
          {s.topCategories.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">No categories yet.</p> :
            <div className="space-y-3">{s.topCategories.map((c: any) => (
              <div key={c.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700 font-medium">{c.name}</span>
                <span className="text-xs font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-full">{c.article_count} articles</span>
              </div>
            ))}</div>
          }
        </div>
      </div>
    </div>
  );
}
