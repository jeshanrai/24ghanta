"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, KeyRound } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function getToken() { return localStorage.getItem("24ghanta_admin_token") || ""; }

type Author = {
  id: number;
  name: string;
  avatar_url: string | null;
  username: string | null;
  email: string | null;
  is_active: boolean;
  article_count?: number;
};

type FormState = {
  name: string;
  avatar_url: string;
  username: string;
  email: string;
  password: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  avatar_url: "",
  username: "",
  email: "",
  password: "",
  is_active: true,
};

export default function AuthorsPage() {
  const [items, setItems] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`${API}/api/admin/authors`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function startEdit(item: Author) {
    setEditing(item.id);
    setShowNew(false);
    setError("");
    setForm({
      name: item.name,
      avatar_url: item.avatar_url || "",
      username: item.username || "",
      email: item.email || "",
      password: "",
      is_active: item.is_active !== false,
    });
  }
  function startNew() { setShowNew(true); setEditing(null); setForm(emptyForm); setError(""); }
  function cancel() { setEditing(null); setShowNew(false); setError(""); }

  async function save(id?: number) {
    setError("");
    if (!form.name) { setError("Name is required"); return; }
    if (form.username && !form.username.match(/^[a-zA-Z0-9_.-]{3,}$/)) {
      setError("Username must be at least 3 chars (letters, numbers, . _ -)"); return;
    }
    if (!id && form.username && !form.password) {
      setError("Password is required when creating a login"); return;
    }
    if (form.password && form.password.length < 6) {
      setError("Password must be at least 6 characters"); return;
    }

    const body: Partial<FormState> = { ...form };
    if (!body.password) delete body.password; // don't send empty password on edit

    try {
      const res = await fetch(`${API}/api/admin/authors${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      cancel(); load();
    } catch (e: any) { setError(e.message); }
  }

  async function remove(id: number) {
    if (!confirm("Delete this author? Any articles they wrote will lose their byline.")) return;
    await fetch(`${API}/api/admin/authors/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    load();
  }

  const fieldCls = "px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20";
  const labelCls = "text-xs font-semibold text-gray-500 uppercase block mb-1.5";

  const renderForm = (id?: number) => (
    <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200">
      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Full Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={`${fieldCls} w-full`} placeholder="Priya Sharma" />
        </div>
        <div>
          <label className={labelCls}>Avatar URL</label>
          <input value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} className={`${fieldCls} w-full`} placeholder="https://..." />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-semibold text-gray-600 uppercase">Login Credentials</h3>
          <span className="text-xs text-gray-400">
            {id ? "(leave password blank to keep current)" : "(grants access to this panel)"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Username</label>
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className={`${fieldCls} w-full font-mono`} placeholder="priya.sharma" autoComplete="off" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" className={`${fieldCls} w-full`} placeholder="priya@24ghanta.com" autoComplete="off" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Password {!id && form.username && "*"}</label>
            <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} type="password" className={`${fieldCls} w-full`} placeholder={id ? "Leave blank to keep existing" : "Minimum 6 characters"} autoComplete="new-password" />
          </div>
        </div>
        {id && (
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 text-red-600 rounded" />
            <span className="text-sm text-gray-700">Active (can sign in)</span>
          </label>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={() => save(id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"><Check className="w-3.5 h-3.5" /> {id ? "Update" : "Create"}</button>
        <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"><X className="w-3.5 h-3.5" /> Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Authors</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} authors · manage credentials to give them CMS access</p>
        </div>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700"><Plus className="w-4 h-4" /> Add Author</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        {showNew && renderForm()}
        {loading ? (
          <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mx-auto" /></div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-gray-400">No authors yet. Add your first writer!</p>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id}>
                {editing === item.id ? renderForm(item.id) : (
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center font-bold text-red-700 text-sm shrink-0">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {item.username ? (
                            <>
                              <span className="font-mono">@{item.username}</span>
                              {item.is_active === false && (
                                <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-semibold">Disabled</span>
                              )}
                            </>
                          ) : (
                            <span className="italic">No login configured</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{item.article_count || 0} articles</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Edit"><Pencil className="w-4 h-4 text-blue-600" /></button>
                        <button onClick={() => remove(item.id)} className="p-1.5 rounded-lg hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
