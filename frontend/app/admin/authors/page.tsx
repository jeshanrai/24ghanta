"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function getToken() { return localStorage.getItem("24ghanta_admin_token") || ""; }

export default function AuthorsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", avatar_url: "" });
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`${API}/api/admin/authors`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function startEdit(item: any) { setEditing(item.id); setForm({ name: item.name, avatar_url: item.avatar_url || "" }); setShowNew(false); }
  function startNew() { setShowNew(true); setEditing(null); setForm({ name: "", avatar_url: "" }); }
  function cancel() { setEditing(null); setShowNew(false); setError(""); }

  async function save(id?: number) {
    setError("");
    if (!form.name) { setError("Name is required"); return; }
    try {
      const res = await fetch(`${API}/api/admin/authors${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      cancel(); load();
    } catch (e: any) { setError(e.message); }
  }

  async function remove(id: number) {
    if (!confirm("Delete this author?")) return;
    await fetch(`${API}/api/admin/authors/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    load();
  }

  const renderForm = (id?: number) => (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Author name *" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
        <input value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="Avatar URL (optional)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => save(id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"><Check className="w-3.5 h-3.5" /> {id ? "Update" : "Create"}</button>
        <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"><X className="w-3.5 h-3.5" /> Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Authors</h1><p className="text-sm text-gray-500 mt-1">{items.length} authors</p></div>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700"><Plus className="w-4 h-4" /> Add Author</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        {showNew && renderForm()}
        {loading ? <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mx-auto" /></div> :
        items.length === 0 ? <p className="py-12 text-center text-gray-400">No authors. Add your first writer!</p> :
        <div className="space-y-2">{items.map(item => (
          <div key={item.id}>
            {editing === item.id ? renderForm(item.id) : (
              <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center font-bold text-red-700 text-sm">
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div><p className="text-sm font-medium text-gray-900">{item.name}</p>
                  {item.avatar_url && <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.avatar_url}</p>}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{item.article_count || 0} articles</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100"><Pencil className="w-4 h-4 text-blue-600" /></button>
                    <button onClick={() => remove(item.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}</div>}
      </div>
    </div>
  );
}
