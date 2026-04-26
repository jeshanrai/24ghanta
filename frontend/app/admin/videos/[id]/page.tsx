"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Globe, Trash2, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { confirmAction } from "@/components/ui/ConfirmDialog";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function getToken() { return localStorage.getItem("24ghanta_admin_token") || ""; }
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim(); }

const STATIC_CATEGORIES = [
  { id: 1, name: "World" },
  { id: 2, name: "India" },
  { id: 3, name: "Politics" },
  { id: 4, name: "Sports" },
  { id: 5, name: "Entertainment" },
  { id: 6, name: "Business" },
  { id: 7, name: "Technology" },
  { id: 8, name: "Health" },
  { id: 9, name: "Lifestyle" },
  { id: 10, name: "Science" },
  { id: 11, name: "Gen Z" }
];

export default function EditVideoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [authors, setAuthors] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSeo, setShowSeo] = useState(false);
  const [role, setRole] = useState<"admin" | "author">("admin");
  const [currentAuthorId, setCurrentAuthorId] = useState<string>("");
  const [form, setForm] = useState({
    title: "", slug: "", description: "", thumbnail_url: "", video_url: "", embed_url: "",
    duration_seconds: 0, category_id: "", author_id: "", type: "video", is_published: false,
    meta_title: "", meta_description: "", meta_keywords: "", tag_ids: [] as number[], published_at: "",
  });
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem("24ghanta_admin_role") === "author" ? "author" : "admin";
    setRole(storedRole);
    setCurrentAuthorId(localStorage.getItem("24ghanta_admin_id") || "");
    const h = { Authorization: `Bearer ${getToken()}` };
    Promise.all([
      fetch(`${API}/api/admin/authors`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/tags`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/videos/${id}`, { headers: h }).then(r => r.ok ? r.json() : null),
    ]).then(([a, t, video]) => {
      setAuthors(a); setAllTags(t);
      if (video) setForm({
        title: video.title || "", slug: video.slug || "", description: video.description || "",
        thumbnail_url: video.thumbnail_url || "", video_url: video.video_url || "", embed_url: video.embed_url || "",
        duration_seconds: video.duration_seconds || 0, category_id: video.category_id ? String(video.category_id) : "",
        author_id: video.author_id ? String(video.author_id) : "",
        type: video.type || "video", is_published: video.is_published || false,
        meta_title: video.meta_title || "", meta_description: video.meta_description || "", meta_keywords: video.meta_keywords || "",
        tag_ids: (video.tags || []).map((t: any) => t.id), published_at: video.published_at || "",
      });
      setLoading(false);
    });
  }, [id]);

  function update(key: string, val: any) { setForm(f => ({ ...f, [key]: val })); }
  function toggleTag(tid: number) { setForm(f => ({ ...f, tag_ids: f.tag_ids.includes(tid) ? f.tag_ids.filter(t => t !== tid) : [...f.tag_ids, tid] })); }

  async function createTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setIsCreatingTag(true);
    try {
      const slug = slugify(newTagName);
      const res = await fetch(`${API}/api/admin/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name: newTagName.trim(), slug })
      });
      if (res.ok) {
        const newTag = await res.json();
        setAllTags(prev => [...prev, newTag]);
        setForm(f => ({ ...f, tag_ids: [...f.tag_ids, newTag.id] }));
        setNewTagName("");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create tag");
      }
    } catch (err) {
      alert("Failed to create tag");
    } finally {
      setIsCreatingTag(false);
    }
  }

  async function handleSave(publish?: boolean) {
    if (publish !== undefined && publish !== form.is_published) {
      const goingLive = publish === true;
      const ok = await confirmAction({
        title: goingLive ? "Publish video?" : "Unpublish video?",
        message: goingLive
          ? "This video will become visible on the public site."
          : "This video will be hidden from the public site.",
        confirmLabel: goingLive ? "Publish" : "Unpublish",
        variant: goingLive ? "info" : "warning",
      });
      if (!ok) return;
    }
    setSaving(true); setError("");
    const body = { ...form, is_published: publish !== undefined ? publish : form.is_published };
    try {
      const res = await fetch(`${API}/api/admin/videos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push("/admin/videos");
    } catch (e: any) { setError(e.message || "Failed to save"); } finally { setSaving(false); }
  }

  async function handleDelete() {
    const ok = await confirmAction({
      title: "Delete video?",
      message: <>This will permanently delete <span className="font-semibold">{form.title || "this video"}</span>. This action cannot be undone.</>,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    await fetch(`${API}/api/admin/videos/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    router.push("/admin/videos");
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/videos" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div><h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Video</h1><p className="text-xs text-gray-400 mt-0.5">ID: {id}</p></div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleDelete} className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50"><Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Delete</span></button>
          <button onClick={() => handleSave()} disabled={saving || !form.title} className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"><Save className="w-4 h-4" /> Save</button>
          <button onClick={() => handleSave(!form.is_published)} disabled={saving} className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium ${form.is_published ? "border border-orange-200 text-orange-600 hover:bg-orange-50" : "bg-red-600 text-white hover:bg-red-700"}`}>
            <Globe className="w-4 h-4" /> {form.is_published ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Title *</label>
              <input value={form.title} onChange={e => update("title", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Slug</label>
              <input value={form.slug} onChange={e => update("slug", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Description</label>
              <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Video URL</label>
                <input value={form.video_url} onChange={e => update("video_url", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Embed URL</label>
                <input value={form.embed_url} onChange={e => update("embed_url", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" /></div>
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
              <input value={form.thumbnail_url} onChange={e => update("thumbnail_url", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Category</label>
              <select value={form.category_id} onChange={e => update("category_id", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"><option value="">Select</option>{STATIC_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Author</label>
              {role === "author" ? (
                <div className="px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm text-gray-700">
                  {authors.find(a => String(a.id) === (form.author_id || currentAuthorId))?.name || "You"}
                  <span className="ml-2 text-xs text-gray-400">(locked)</span>
                </div>
              ) : (
                <select value={form.author_id} onChange={e => update("author_id", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20">
                  <option value="">Select author</option>{authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
            </div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Type</label>
              <select value={form.type} onChange={e => update("type", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"><option value="video">Video</option><option value="youtube">YouTube</option><option value="instagram">Instagram</option></select></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Duration (seconds)</label>
              <input type="number" value={form.duration_seconds} onChange={e => update("duration_seconds", parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" /></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Tags</label>
            <div className="flex flex-wrap gap-2">{allTags.map(t => (
              <button key={t.id} onClick={() => toggleTag(t.id)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${form.tag_ids.includes(t.id) ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{t.name}</button>
            ))}</div>
            <form onSubmit={createTag} className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="New tag name"
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-400"
                />
                <button
                  type="submit"
                  disabled={isCreatingTag || !newTagName.trim()}
                  className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  title="Create tag"
                >
                  {isCreatingTag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              </form>
          </div>
        </div>
      </div>
    </div>
  );
}
