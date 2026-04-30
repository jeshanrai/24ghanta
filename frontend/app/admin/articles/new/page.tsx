"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { RichTextEditor, GalleryField, type GalleryItem } from "@/components/ui";

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

export default function NewArticlePage() {
  const router = useRouter();
  const [authors, setAuthors] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState<"admin" | "author">("admin");
  const [currentAuthorId, setCurrentAuthorId] = useState<string>("");
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", category_id: "", author_id: "",
    image_url: "", image_alt: "", is_featured: false, is_breaking: false, is_published: false,
    display_order: "" as string,
    meta_title: "", meta_description: "", meta_keywords: "", tag_ids: [] as number[],
    gallery: [] as GalleryItem[],
  });
  const [showSeo, setShowSeo] = useState(false);

  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem("24ghanta_admin_role") === "author" ? "author" : "admin";
    const storedId = localStorage.getItem("24ghanta_admin_id") || "";
    setRole(storedRole);
    setCurrentAuthorId(storedId);
    if (storedRole === "author" && storedId) {
      setForm(f => ({ ...f, author_id: storedId }));
    }
    const h = { Authorization: `Bearer ${getToken()}` };
    Promise.all([
      fetch(`${API}/api/admin/authors`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/admin/tags`, { headers: h }).then(r => r.ok ? r.json() : []),
    ]).then(([a, t]) => { setAuthors(a); setTags(t); });
  }, []);

  function update(key: string, val: any) {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === "title" && f.slug === slugify(f.title)) next.slug = slugify(val);
      return next;
    });
  }

  function toggleTag(id: number) {
    setForm(f => ({ ...f, tag_ids: f.tag_ids.includes(id) ? f.tag_ids.filter(t => t !== id) : [...f.tag_ids, id] }));
  }

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
        setTags(prev => [...prev, newTag]);
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

  async function handleSubmit(publish: boolean) {
    setSaving(true); setError("");
    const body = { ...form, is_published: publish, slug: form.slug || slugify(form.title) };
    try {
      const res = await fetch(`${API}/api/admin/articles`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push("/admin/articles");
    } catch (e: any) { setError(e.message || "Failed to save"); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/articles" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div><h1 className="text-xl sm:text-2xl font-bold text-gray-900">New Article</h1></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSubmit(false)} disabled={saving || !form.title} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"><Save className="w-4 h-4" /> Save Draft</button>
          <button onClick={() => handleSubmit(true)} disabled={saving || !form.title} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"><Globe className="w-4 h-4" /> Publish</button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Title *</label>
              <input value={form.title} onChange={e => update("title", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" placeholder="Article title" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Slug</label>
              <input value={form.slug} onChange={e => update("slug", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 font-mono text-gray-600" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Excerpt</label>
              <textarea value={form.excerpt} onChange={e => update("excerpt", e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none" placeholder="Short summary..." /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Content</label>
              <RichTextEditor value={form.content} onChange={(html) => update("content", html)} placeholder="Write your story… use the toolbar for headings, images, YouTube, tweets and pull-quotes." /></div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Image Gallery</label>
              <span className="text-[11px] text-gray-400">Optional — shown below the article</span>
            </div>
            <GalleryField value={form.gallery} onChange={(g) => update("gallery", g)} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <button onClick={() => setShowSeo(!showSeo)} className="flex items-center justify-between w-full text-sm font-semibold text-gray-700">
              <span>SEO Settings</span><span className="text-xs text-gray-400">{showSeo ? "▲" : "▼"}</span>
            </button>
            {showSeo && <div className="mt-4 space-y-4">
              <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Meta Title</label>
                <input value={form.meta_title} onChange={e => update("meta_title", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" placeholder="Custom title for search engines" /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Meta Description</label>
                <textarea value={form.meta_description} onChange={e => update("meta_description", e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none" placeholder="Description for search engines (150-160 chars)" /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Meta Keywords</label>
                <input value={form.meta_keywords} onChange={e => update("meta_keywords", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" placeholder="keyword1, keyword2, keyword3" /></div>
            </div>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Category</label>
              <select value={form.category_id} onChange={e => update("category_id", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20">
                <option value="">Select category</option>{STATIC_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Author</label>
              {role === "author" ? (
                <div className="px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm text-gray-700">
                  {authors.find(a => String(a.id) === currentAuthorId)?.name || "You"}
                  <span className="ml-2 text-xs text-gray-400">(locked to your account)</span>
                </div>
              ) : (
                <select value={form.author_id} onChange={e => update("author_id", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20">
                  <option value="">Select author</option>{authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
            </div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Image URL *</label>
              <ImageUploadField value={form.image_url} onChange={(v) => update("image_url", v)} placeholder="https://... or upload .webp" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Image Alt Text</label>
              <input value={form.image_alt} onChange={e => update("image_alt", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" placeholder="Describe the image" /></div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <button key={t.id} onClick={() => toggleTag(t.id)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${form.tag_ids.includes(t.id) ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{t.name}</button>
              ))}
              {tags.length === 0 && <p className="text-xs text-gray-400">No tags created yet.</p>}
            </div>
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

          {role !== "author" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.is_featured} onChange={e => update("is_featured", e.target.checked)} className="w-4 h-4 text-red-600 rounded" /><span className="text-sm text-gray-700">Featured Article</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.is_breaking} onChange={e => update("is_breaking", e.target.checked)} className="w-4 h-4 text-red-600 rounded" /><span className="text-sm text-gray-700">Breaking News</span></label>
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={form.display_order}
                  onChange={e => update("display_order", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  placeholder="e.g., 1"
                />
                <p className="text-xs text-gray-400 mt-1.5">Lower number = higher on the page. Leave blank to sort by published date.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
