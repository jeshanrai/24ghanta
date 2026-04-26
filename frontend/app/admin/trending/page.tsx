"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { confirmAction } from "@/components/ui/ConfirmDialog";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function getToken() { return localStorage.getItem("24ghanta_admin_token") || ""; }

type TrendingItem = {
  id: number;
  label: string;
  href: string;
  badge: string | null;
  priority: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

type FormState = {
  label: string;
  href: string;
  badge: string;
  expires_at: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  label: "",
  href: "",
  badge: "",
  expires_at: "",
  is_active: true,
};

export default function TrendingAdminPage() {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/trending`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function startEdit(item: TrendingItem) {
    setEditing(item.id);
    setShowNew(false);
    setError("");
    setForm({
      label: item.label,
      href: item.href || "",
      badge: item.badge || "",
      expires_at: item.expires_at ? item.expires_at.slice(0, 16) : "",
      is_active: item.is_active !== false,
    });
  }
  function startNew() { setShowNew(true); setEditing(null); setForm(emptyForm); setError(""); }
  function cancel() { setEditing(null); setShowNew(false); setError(""); }

  async function save(id?: number) {
    setError("");
    if (!form.label.trim()) { setError("Label is required"); return; }
    const body = {
      label: form.label.trim(),
      href: form.href.trim() || "#",
      badge: form.badge.trim() || null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
    };
    try {
      const res = await fetch(`${API}/api/admin/trending${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Save failed");
      }
      cancel();
      load();
    } catch (e: any) { setError(e.message); }
  }

  async function remove(id: number) {
    const item = items.find(i => i.id === id);
    const ok = await confirmAction({
      title: "Delete trending topic?",
      message: <>This will permanently remove <span className="font-semibold">{item?.label || "this topic"}</span> from the trending bar.</>,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    await fetch(`${API}/api/admin/trending/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    load();
  }

  async function toggleActive(id: number) {
    await fetch(`${API}/api/admin/trending/${id}/toggle`, { method: "PATCH", headers: { Authorization: `Bearer ${getToken()}` } });
    load();
  }

  async function move(id: number, direction: -1 | 1) {
    const sorted = [...items].sort((a, b) => a.priority - b.priority);
    const idx = sorted.findIndex(i => i.id === id);
    const swapWith = idx + direction;
    if (idx < 0 || swapWith < 0 || swapWith >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapWith];
    const order = sorted.map((it, i) => {
      if (it.id === a.id) return { id: a.id, priority: b.priority };
      if (it.id === b.id) return { id: b.id, priority: a.priority };
      return { id: it.id, priority: it.priority || i + 1 };
    });
    await fetch(`${API}/api/admin/trending/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ order }),
    });
    load();
  }

  const fieldCls = "px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20";
  const labelCls = "text-xs font-semibold text-gray-500 uppercase block mb-1.5";

  const renderForm = (id?: number) => (
    <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200">
      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Label *</label>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className={`${fieldCls} w-full`} placeholder="Election Results" />
        </div>
        <div>
          <label className={labelCls}>Link (href)</label>
          <input value={form.href} onChange={e => setForm(f => ({ ...f, href: e.target.value }))} className={`${fieldCls} w-full font-mono`} placeholder="/category/politics" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Badge (optional)</label>
          <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} className={`${fieldCls} w-full`} placeholder="LIVE" maxLength={12} />
        </div>
        <div>
          <label className={labelCls}>Expires at (optional)</label>
          <input
            type="datetime-local"
            value={form.expires_at}
            onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
            className={`${fieldCls} w-full`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 py-2 px-3 bg-white rounded-lg border border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-800">Active</p>
          <p className="text-xs text-gray-500">Inactive topics are hidden from the public trending bar.</p>
        </div>
        <ToggleSwitch checked={form.is_active} onChange={() => setForm(f => ({ ...f, is_active: !f.is_active }))} />
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={() => save(id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"><Check className="w-3.5 h-3.5" /> {id ? "Update" : "Create"}</button>
        <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"><X className="w-3.5 h-3.5" /> Cancel</button>
      </div>
    </div>
  );

  const sorted = [...items].sort((a, b) => a.priority - b.priority);
  const activeCount = items.filter(i => i.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" /> Trending Bar
          </h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} topics · {activeCount} live · shown in the red strip below the header</p>
        </div>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700"><Plus className="w-4 h-4" /> Add Topic</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-5 space-y-4">
        {showNew && renderForm()}
        {loading ? (
          <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mx-auto" /></div>
        ) : sorted.length === 0 ? (
          <p className="py-12 text-center text-gray-400">No trending topics yet. Add the first one to override the default list.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((item, idx) => (
              <div key={item.id}>
                {editing === item.id ? renderForm(item.id) : (
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col">
                        <button
                          onClick={() => move(item.id, -1)}
                          disabled={idx === 0}
                          className="p-0.5 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        ><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button
                          onClick={() => move(item.id, 1)}
                          disabled={idx === sorted.length - 1}
                          className="p-0.5 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        ><ArrowDown className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center font-bold text-red-700 text-xs shrink-0">{idx + 1}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-sm bg-red-600 text-white text-[10px] font-bold uppercase tracking-wide">
                              {item.badge}
                            </span>
                          )}
                          <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap mt-0.5">
                          <span className="font-mono truncate">{item.href}</span>
                          {item.expires_at && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                              Expires {new Date(item.expires_at).toLocaleString()}
                            </span>
                          )}
                          {!item.is_active && (
                            <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">Hidden</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <ToggleSwitch checked={item.is_active} onChange={() => toggleActive(item.id)} />
                      <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
