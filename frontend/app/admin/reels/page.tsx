"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, ExternalLink } from "lucide-react";
import { confirmAction } from "@/components/ui/ConfirmDialog";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function getToken() {
  return typeof window === "undefined" ? "" : localStorage.getItem("24ghanta_admin_token") || "";
}

type Platform = "tiktok" | "instagram" | "facebook" | "youtube";

interface Reel {
  id: number;
  platform: Platform;
  url: string;
  caption: string;
  sort_order: number;
  is_active: boolean;
}

const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
};

const PLATFORM_COLOR: Record<Platform, string> = {
  tiktok: "bg-black text-white",
  instagram: "bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white",
  facebook: "bg-[#1877F2] text-white",
  youtube: "bg-[#FF0000] text-white",
};

const emptyForm: Omit<Reel, "id"> = {
  platform: "youtube",
  url: "",
  caption: "",
  sort_order: 0,
  is_active: true,
};

const URL_PLACEHOLDER: Record<Platform, string> = {
  tiktok: "https://www.tiktok.com/@24ghanta_nepal/video/<id>",
  instagram: "https://www.instagram.com/reel/<shortcode>/",
  facebook: "https://www.facebook.com/<page>/videos/<id>/",
  youtube: "https://www.youtube.com/watch?v=<id>  (or /shorts/<id>)",
};

const URL_HELP: Record<Platform, string> = {
  tiktok: "Post link only — tiktok.com/@user/video/<id> or a vm./vt.tiktok.com short link.",
  instagram: "Must be a reel or post permalink (instagram.com/reel/<id>/ or /p/<id>/). Profile pages can't be embedded.",
  facebook: "Must point to a specific video, reel, or post (/videos/<id>, /reel/<id>, /posts/<id>). Page URLs can't be embedded.",
  youtube: "Any YouTube watch / shorts / youtu.be link.",
};

// Mirrors `validatePermalink` in backend/src/routes/admin-reels.ts —
// keep both copies in sync. Catching bad URLs here avoids a save +
// re-render round-trip and gives instant feedback in the form.
function validatePermalink(platform: Platform, rawUrl: string): { ok: true } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "URL is not valid" };
  }
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;

  switch (platform) {
    case "tiktok":
      if (
        (/(^|\.)tiktok\.com$/.test(host) && /\/video\/\d+/.test(path)) ||
        /(^|\.)vm\.tiktok\.com$/.test(host) ||
        /(^|\.)vt\.tiktok\.com$/.test(host)
      ) return { ok: true };
      return { ok: false, reason: URL_HELP.tiktok };
    case "instagram":
      if (!/(^|\.)instagram\.com$/.test(host)) {
        return { ok: false, reason: "Instagram URL must be on instagram.com." };
      }
      if (/^\/(p|reel|tv)\/[^/]+\/?$/.test(path)) return { ok: true };
      return { ok: false, reason: URL_HELP.instagram };
    case "facebook":
      if (!/(^|\.)facebook\.com$/.test(host) && !/(^|\.)fb\.watch$/.test(host)) {
        return { ok: false, reason: "Facebook URL must be on facebook.com or fb.watch." };
      }
      if (/(^|\.)fb\.watch$/.test(host)) return { ok: true };
      if (/\/(videos|reel|posts|watch)\b/.test(path)) return { ok: true };
      return { ok: false, reason: URL_HELP.facebook };
    case "youtube":
      if (/(^|\.)youtube\.com$/.test(host) || /(^|\.)youtu\.be$/.test(host) || /(^|\.)youtube-nocookie\.com$/.test(host)) {
        return { ok: true };
      }
      return { ok: false, reason: "YouTube URL must be on youtube.com or youtu.be." };
  }
}

export default function AdminReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reel | null>(null);
  const [form, setForm] = useState<Omit<Reel, "id">>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/reels`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        setReels(Array.isArray(json?.data) ? json.data : []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: reels.length });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(reel: Reel) {
    setEditing(reel);
    setForm({
      platform: reel.platform,
      url: reel.url,
      caption: reel.caption,
      sort_order: reel.sort_order,
      is_active: reel.is_active,
    });
    setError(null);
    setModalOpen(true);
  }

  async function save() {
    setError(null);
    if (!form.url.trim()) {
      setError("URL is required");
      return;
    }
    const permalink = validatePermalink(form.platform, form.url.trim());
    if (!permalink.ok) {
      setError(permalink.reason);
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `${API}/api/admin/reels/${editing.id}` : `${API}/api/admin/reels`;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to save");
        return;
      }
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(reel: Reel) {
    const ok = await confirmAction({
      title: "Delete reel?",
      message: (
        <>
          This will remove the {PLATFORM_LABEL[reel.platform]} reel from the homepage. This action cannot be undone.
        </>
      ),
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    await fetch(`${API}/api/admin/reels/${reel.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    load();
  }

  async function toggleActive(reel: Reel) {
    await fetch(`${API}/api/admin/reels/${reel.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ is_active: !reel.is_active }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reels &amp; Shorts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {reels.length} total · Embed live TikTok, Instagram, Facebook, or YouTube posts on the homepage.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 !text-white rounded-xl text-sm font-medium hover:bg-red-700"
        >
          <Plus className="w-4 h-4" /> Add Reel
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : reels.length === 0 ? (
          <p className="py-16 text-center text-gray-400">
            No reels yet. Click <span className="font-medium text-gray-600">“Add Reel”</span> to paste a post URL.
          </p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-3 text-gray-500 font-medium w-24">Order</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium w-32">Platform</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium">URL / Caption</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium w-28">Status</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reels.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-3 text-gray-600">{r.sort_order}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PLATFORM_COLOR[r.platform]}`}>
                          {PLATFORM_LABEL[r.platform]}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-gray-900 hover:text-red-600 line-clamp-1 font-medium"
                        >
                          <span className="line-clamp-1 max-w-[36ch]">{r.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                        {r.caption && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{r.caption}</p>}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => toggleActive(r)}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            r.is_active ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {r.is_active ? "Visible" : "Hidden"}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Edit">
                            <Pencil className="w-4 h-4 text-blue-600" />
                          </button>
                          <button onClick={() => remove(r)} className="p-1.5 rounded-lg hover:bg-red-50" title="Delete">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {reels.map((r) => (
                <div key={r.id} className="py-3 px-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${PLATFORM_COLOR[r.platform]}`}>
                      {PLATFORM_LABEL[r.platform]}
                    </span>
                    <button
                      onClick={() => toggleActive(r)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        r.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {r.is_active ? "Visible" : "Hidden"}
                    </button>
                  </div>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs text-gray-700 line-clamp-1">
                    {r.url}
                  </a>
                  {r.caption && <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{r.caption}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-gray-100">
                      <Pencil className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                    <button onClick={() => remove(r)} className="p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Edit reel" : "Add reel"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Platform</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, platform: p })}
                      className={`text-xs font-medium px-2 py-2 rounded-lg border transition-colors ${
                        form.platform === p
                          ? "border-red-600 bg-red-50 text-red-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {PLATFORM_LABEL[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Post URL</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder={URL_PLACEHOLDER[form.platform]}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 ${
                    form.url.trim() && !validatePermalink(form.platform, form.url.trim()).ok
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-red-500"
                  }`}
                />
                {/* Live preview: switches to a red error message if the
                    URL doesn't match the chosen platform's permalink
                    shape; otherwise shows the per-platform help text. */}
                {(() => {
                  const trimmed = form.url.trim();
                  if (!trimmed) {
                    return <p className="text-[11px] text-gray-400 mt-1">{URL_HELP[form.platform]}</p>;
                  }
                  const result = validatePermalink(form.platform, trimmed);
                  if (result.ok) {
                    return <p className="text-[11px] text-green-600 mt-1">Looks like a valid {PLATFORM_LABEL[form.platform]} permalink.</p>;
                  }
                  return <p className="text-[11px] text-red-600 mt-1">{result.reason}</p>;
                })()}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Caption (optional)</label>
                <textarea
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Sort order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Lower numbers appear first.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Visibility</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      form.is_active
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                  >
                    {form.is_active ? "Visible on site" : "Hidden"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editing ? "Save changes" : "Create reel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
