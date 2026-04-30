"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  TrendingUp,
  Eye,
  ArrowUpRight,
  Plus,
  Video,
  BarChart3,
  Tag,
  UserPen,
  Clock,
  Megaphone,
  MousePointerClick,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const REFRESH_MS = 15_000; // poll dashboard every 15s for live ad counters

interface AdPerformer {
  id: number;
  name: string;
  placement: string;
  impressions: number;
  clicks: number;
  ctr: number | string;
}

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("24ghanta_admin_token");
    if (!token) return;

    let cancelled = false;
    const load = (initial: boolean) => {
      if (!initial) setRefreshing(true);
      fetch(`${API}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!cancelled && d) setData(d);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
            setRefreshing(false);
          }
        });
    };

    load(true);
    const id = setInterval(() => load(false), REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );

  const s = data || {
    articles: { total: 0, published: 0, drafts: 0, totalViews: 0 },
    videos: { total: 0 },
    categories: { total: 0 },
    tags: { total: 0 },
    authors: { total: 0 },
    ads: { total: 0, active: 0, impressions: 0, clicks: 0, ctr: 0, topPerformers: [] as AdPerformer[] },
    recentArticles: [],
    topCategories: [],
  };

  const isAdmin = s.role !== "author";
  const fmt = (n: number) => Number(n || 0).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            Overview of your CMS
            {refreshing && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                live
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all"
        >
          <Plus className="w-4 h-4" /> New Article
        </Link>
      </div>

      {/* Top stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {[
          { href: "/admin/articles", icon: FileText, color: "blue", label: "Articles", value: s.articles.total, sub: `${s.articles.published} published` },
          { href: "/admin/articles", icon: Eye, color: "purple", label: "Total Views", value: fmt(s.articles.totalViews), sub: "All time" },
          { href: "/admin/videos", icon: Video, color: "red", label: "Videos", value: s.videos.total, sub: "Multimedia" },
          { href: "/admin/categories", icon: BarChart3, color: "green", label: "Categories", value: s.categories.total, sub: "Sections" },
          { href: "/admin/tags", icon: Tag, color: "orange", label: "Tags", value: s.tags.total, sub: "SEO tags" },
          { href: "/admin/authors", icon: UserPen, color: "indigo", label: "Authors", value: s.authors.total, sub: "Writers" },
        ].map((c) => (
          <Link key={c.label} href={c.href} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${c.color}-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <c.icon className={`w-5 h-5 text-${c.color}-600`} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">{c.label}</p>
            <p className="text-[10px] text-green-600 font-medium mt-1 sm:mt-2">{c.sub}</p>
          </Link>
        ))}
      </div>

      {/* Ad performance — admins only */}
      {isAdmin && (
        <div className="bg-gradient-to-br from-white to-red-50/30 rounded-2xl border border-red-100 p-5 sm:p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Ad performance</h2>
                <p className="text-xs text-gray-500">
                  {s.ads.active} of {s.ads.total} ads currently active · counters refresh every 15s
                </p>
              </div>
            </div>
            <Link href="/admin/ads" className="text-xs text-red-600 font-medium hover:underline">
              Manage ads →
            </Link>
          </div>

          {/* Ad summary tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <AdMetric icon={Eye}                 color="blue"   label="Impressions" value={fmt(s.ads.impressions)} sub="Times shown to users" />
            <AdMetric icon={MousePointerClick}   color="green"  label="Clicks"      value={fmt(s.ads.clicks)}      sub="Click-throughs to advertiser" />
            <AdMetric icon={TrendingUp}          color="orange" label="CTR"         value={`${s.ads.ctr}%`}        sub="Clicks ÷ impressions" />
            <AdMetric icon={Megaphone}           color="red"    label="Active ads"  value={`${s.ads.active}`}      sub={`${s.ads.total - s.ads.active} paused / scheduled`} />
          </div>

          {/* Top performers */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Top performing ads
            </h3>
            {s.ads.topPerformers.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                No active ads to rank yet. Create one in <Link href="/admin/ads" className="text-red-600 hover:underline">Ads</Link>.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <th className="text-left px-2 py-2">Ad</th>
                      <th className="text-right px-2 py-2">Impr.</th>
                      <th className="text-right px-2 py-2">Clicks</th>
                      <th className="text-right px-2 py-2">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.ads.topPerformers.map((ad: AdPerformer) => (
                      <tr key={ad.id} className="border-b border-gray-50 last:border-0 hover:bg-white transition-colors">
                        <td className="px-2 py-2.5 min-w-0">
                          <p className="text-gray-900 font-medium truncate">{ad.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{ad.placement}</p>
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-gray-700">
                          {fmt(ad.impressions)}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-gray-900 font-semibold">
                          {fmt(ad.clicks)}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[11px] font-semibold">
                            {ad.ctr}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Existing two-column block (recent articles + top categories) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Articles</h3>
            <Link href="/admin/articles" className="text-xs text-red-600 font-medium hover:underline">View all →</Link>
          </div>
          {s.recentArticles.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No articles yet. Create your first one!</p>
          ) : (
            <div className="space-y-3">
              {s.recentArticles.map((a: any) => (
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
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Top Categories</h3>
          {s.topCategories.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No categories yet.</p>
          ) : (
            <div className="space-y-3">
              {s.topCategories.map((c: any) => (
                <div key={c.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 font-medium">{c.name}</span>
                  <span className="text-xs font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-full">{c.article_count} articles</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdMetric({
  icon: Icon,
  color,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "green" | "orange" | "red";
  label: string;
  value: string | number;
  sub: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-[10px] text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
