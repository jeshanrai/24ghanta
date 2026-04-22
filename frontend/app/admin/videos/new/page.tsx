"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function getToken() { return localStorage.getItem("24ghanta_admin_token") || ""; }
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").trim(); }

export default function NewVideoPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSeo, setShowSeo] = useState(false);
  const [form, setForm] = useState({
    title: "", slug: "", description: "", thumbnail_url: "", video_url: "", embed_url: "",
    duration_seconds: 0, category_id: "", type: "video", is_published: false,
    meta_title: "", meta_description: "", meta_keywords: "", tag_ids: [] as number[],
  });

  useEffect(() => {
    const h = { Authorization: `Bearer ${getToken()}` };
    Promise.all([
      fetch(`${API}/api/admin/categories`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/tags`, { headers: h }).then(r => r.ok ? r.json() : []),
    ]).then(([c, t]) => { setCategories(c); setAllTags(t); });
  }, []);

  function update(key: string, val: any) {
    setForm(f => { const n = { ...f, [key]: val }; if (key === "title" && f.slug === slugify(f.title)) n.slug = slugify(val); return n; });
  }
  function toggleTag(id: number) { setForm(f => ({ ...f, tag_ids: f.tag_ids.includes(id) ? f.tag_ids.filter(t => t !== id) : [...f.tag_ids, id] })); }

  async function handleSubmit(publish: boolean) {
    setSaving(true); setError("");
    const body = { ...form, is_published: publish, slug: form.slug || slugify(form.title) };
    try {
      const res = await fetch(`${API}/api/admin/videos`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push("/admin/videos");
    } catch (e: any) { setError(e.message || "Failed to save"); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/videos" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <h1 className="text-2xl font-bold text-gray-900">Add Video</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSubmit(false)} disabled={saving || !form.title} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"><Save className="w-4 h-4" /> Save Draft</button>
          <button onClick={() => handleSubmit(true)} disabled={saving || !form.title} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"><Globe className="w-4 h-4" /> Publish</button>
        </div>
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Title *</label>
              <input value={form.title} onChange={e => update("title", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" placeholder="Video title" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Slug</label>
              <input value={form.slug} onChange={e => update("slug", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/20" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Description</label>
              <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Video URL</label>
                <input value={form.video_url} onChange={e => update("video_url", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" placeholder="https://..." /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Embed URL</label>
                <input value={form.embed_url} onChange={e => update("embed_url", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" placeholder="YouTube/Instagram embed" /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <button onClick={() => setShowSeo(!showSeo)} className="flex items-center justify-between w-full text-sm font-semibold text-gray-700"><span>SEO Settings</span><span className="text-xs text-gray-400">{showSeo ? "▲" : "▼"}</span></button>
            {showSeo && <div className="mt-4 space-y-4">
              <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Meta Title</label><input value={form.meta_title} onChange={e => update("meta_title", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Meta Description</label><textarea value={form.meta_description} onChange={e => update("meta_description", e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none" /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Meta Keywords</label><input value={form.meta_keywords} onChange={e => update("meta_keywords", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" /></div>
            </div>}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Thumbnail URL *</label>
              <input value={form.thumbnail_url} onChange={e => update("thumbnail_url", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" placeholder="https://..." /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Category</label>
              <select value={form.category_id} onChange={e => update("category_id", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Type</label>
              <select value={form.type} onChange={e => update("type", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20">
                <option value="video">Video</option><option value="youtube">YouTube</option><option value="instagram">Instagram</option>
              </select></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Duration (seconds)</label>
              <input type="number" value={form.duration_seconds} onChange={e => update("duration_seconds", parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" /></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Tags</label>
            <div className="flex flex-wrap gap-2">{allTags.map(t => (
              <button key={t.id} onClick={() => toggleTag(t.id)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${form.tag_ids.includes(t.id) ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{t.name}</button>
            ))}{allTags.length === 0 && <p className="text-xs text-gray-400">No tags yet.</p>}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
