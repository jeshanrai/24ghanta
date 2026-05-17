"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Send,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  Search,
  Trash2,
  CheckCircle2,
  Mail,
  Save,
  Eye,
  Plus,
} from "lucide-react";
import { confirmAction } from "@/components/ui/ConfirmDialog";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const token = () =>
  (typeof window !== "undefined" ? localStorage.getItem("24ghanta_admin_token") : null) || "";

interface Settings {
  weekly_digest_enabled: boolean;
  weekly_digest_day_of_week: number;
  weekly_digest_hour: number;
  digest_curation_mode: "auto" | "manual";
  weekly_digest_last_sent_at: string | null;
  weekly_digest_last_sent_count: number;
  schedule_label: string;
}

interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  image_url: string | null;
  category_name: string | null;
  published_at: string | null;
  sort_order?: number;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function NewsletterPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Manual curation
  const [picks, setPicks] = useState<ArticleRow[]>([]);
  const [picksDirty, setPicksDirty] = useState(false);

  // Article search panel
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ArticleRow[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Preview + send-test + send-now
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewArticles, setPreviewArticles] = useState<ArticleRow[]>([]);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);

  const h = useMemo(() => ({ Authorization: `Bearer ${token()}` }), []);

  /* ── Loaders ── */
  const loadSettings = useCallback(async () => {
    setLoadError(null);
    try {
      const r = await fetch(`${API}/api/admin/digest/settings`, { headers: h });
      if (!r.ok) throw new Error(`${r.status}`);
      setSettings(await r.json());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [h]);

  const loadPicks = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/admin/digest/picks`, { headers: h });
      if (!r.ok) return;
      const data = await r.json();
      setPicks(data.data || []);
      setPicksDirty(false);
    } catch {
      /* ignore */
    }
  }, [h]);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/digest/preview`, { headers: h });
      if (!r.ok) throw new Error(`${r.status}`);
      const data = await r.json();
      setPreviewHtml(data.html || "");
      setPreviewArticles(data.articles || []);
    } catch {
      setPreviewHtml("");
      setPreviewArticles([]);
    } finally {
      setPreviewLoading(false);
    }
  }, [h]);

  useEffect(() => {
    loadSettings();
    loadPicks();
    loadPreview();
  }, [loadSettings, loadPicks, loadPreview]);

  /* ── Settings actions ── */
  async function patchSettings(patch: Partial<Settings>) {
    setSaving(true);
    setStatusMsg(null);
    try {
      const r = await fetch(`${API}/api/admin/digest/settings`, {
        method: "PUT",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error || `${r.status}`);
      }
      setSettings(await r.json());
      setStatusMsg("Settings saved.");
      loadPreview();
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  /* ── Picks actions ── */
  function addPick(a: ArticleRow) {
    if (picks.some((p) => p.id === a.id)) return;
    if (picks.length >= 20) {
      setStatusMsg("Maximum 20 picks per digest.");
      return;
    }
    setPicks((prev) => [...prev, a]);
    setPicksDirty(true);
  }
  function removePick(id: number) {
    setPicks((prev) => prev.filter((p) => p.id !== id));
    setPicksDirty(true);
  }
  function movePick(idx: number, dir: -1 | 1) {
    setPicks((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setPicksDirty(true);
  }

  async function savePicks() {
    setSaving(true);
    setStatusMsg(null);
    try {
      const r = await fetch(`${API}/api/admin/digest/picks`, {
        method: "PUT",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({ article_ids: picks.map((p) => p.id) }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error || `${r.status}`);
      }
      setPicksDirty(false);
      setStatusMsg(`Saved ${picks.length} pick(s).`);
      loadPreview();
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  /* ── Search ── */
  useEffect(() => {
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        params.set("limit", "30");
        const r = await fetch(`${API}/api/admin/digest/articles/search?${params}`, { headers: h });
        if (!r.ok) throw new Error();
        const data = await r.json();
        setSearchResults(data.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search, h]);

  /* ── Send-test / Send-now ── */
  async function sendTest() {
    if (!testEmail.trim()) return;
    setSendingTest(true);
    setStatusMsg(null);
    try {
      const r = await fetch(`${API}/api/admin/digest/send-test`, {
        method: "POST",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed");
      setStatusMsg(
        data.reason
          ? `Test skipped: ${data.reason}`
          : `Test sent to ${testEmail.trim()} (${data.sent}/${data.total}).`
      );
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSendingTest(false);
    }
  }

  async function sendNow() {
    const ok = await confirmAction({
      title: "Send digest now?",
      message: "This will immediately email the digest to all active subscribers. This action cannot be undone.",
      confirmLabel: "Send now",
      cancelLabel: "Cancel",
      variant: "warning",
    });
    if (!ok) return;
    setSendingNow(true);
    setStatusMsg(null);
    try {
      const r = await fetch(`${API}/api/admin/digest/send-now`, {
        method: "POST",
        headers: h,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed");
      setStatusMsg(
        data.reason
          ? `Digest skipped: ${data.reason}`
          : `Digest sent: ${data.sent}/${data.total} recipients across ${data.articles} article(s).`
      );
      loadSettings();
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSendingNow(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-20">
        {loadError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            <p className="font-semibold">Could not load newsletter settings</p>
            <p className="mt-1 break-all">{loadError}</p>
          </div>
        ) : (
          <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
        <p className="text-sm text-gray-500 mt-1">
          Weekly digest schedule, curation, and one-off test sends.
        </p>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-3 text-sm flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Status / Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={settings.weekly_digest_enabled ? CheckCircle2 : Clock}
          label="Status"
          value={settings.weekly_digest_enabled ? "Active" : "Paused"}
          color={settings.weekly_digest_enabled ? "green" : "gray"}
        />
        <StatCard
          icon={Calendar}
          label="Next send"
          value={settings.schedule_label}
          color="amber"
        />
        <StatCard
          icon={Mail}
          label="Last send"
          value={
            settings.weekly_digest_last_sent_at
              ? `${new Date(settings.weekly_digest_last_sent_at).toLocaleString()} (${settings.weekly_digest_last_sent_count})`
              : "—"
          }
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Schedule</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.weekly_digest_enabled}
              onChange={(e) => patchSettings({ weekly_digest_enabled: e.target.checked })}
              className="w-4 h-4 text-red-600 rounded"
            />
            <span className="text-sm text-gray-700">Enable weekly digest</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                Day of week
              </label>
              <select
                value={settings.weekly_digest_day_of_week}
                onChange={(e) =>
                  patchSettings({ weekly_digest_day_of_week: parseInt(e.target.value, 10) })
                }
                disabled={!settings.weekly_digest_enabled}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white disabled:bg-gray-50"
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                Hour (Asia/Kathmandu)
              </label>
              <select
                value={settings.weekly_digest_hour}
                onChange={(e) =>
                  patchSettings({ weekly_digest_hour: parseInt(e.target.value, 10) })
                }
                disabled={!settings.weekly_digest_enabled}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white disabled:bg-gray-50"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
              Curation mode
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={settings.digest_curation_mode === "auto"}
                  onChange={() => patchSettings({ digest_curation_mode: "auto" })}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Automatic</div>
                  <div className="text-xs text-gray-500">
                    Pull the last 7 days of published articles automatically.
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={settings.digest_curation_mode === "manual"}
                  onChange={() => patchSettings({ digest_curation_mode: "manual" })}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Manual</div>
                  <div className="text-xs text-gray-500">
                    Hand-pick articles from the panel below. Cleared after each send.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {saving && (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </p>
          )}
        </div>

        {/* Send / test panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Send</h2>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase">
              Test send to
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
              />
              <button
                onClick={sendTest}
                disabled={sendingTest || !testEmail.trim()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Test
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Sends a preview to one address with a banner. No subscribers affected.
            </p>
          </div>
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={sendNow}
              disabled={sendingNow}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {sendingNow ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send digest now
            </button>
            <p className="text-xs text-gray-400 mt-2 flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              Immediately sends to all active subscribers using the same content as the preview.
            </p>
          </div>
        </div>
      </div>

      {/* Manual curation (only useful in manual mode but visible always for transparency) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Curated picks {settings.digest_curation_mode === "auto" && <span className="text-xs font-normal text-gray-400">(used only in Manual mode)</span>}
            </h2>
            {picksDirty && (
              <button
                onClick={savePicks}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" /> Save picks
              </button>
            )}
          </div>

          {picks.length === 0 ? (
            <p className="text-center py-10 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              No picks yet. Add articles from the right.
            </p>
          ) : (
            <ul className="space-y-2">
              {picks.map((p, idx) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-lg hover:bg-gray-50/50"
                >
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => movePick(idx, -1)}
                      className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === picks.length - 1}
                      onClick={() => movePick(idx, 1)}
                      className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                    >
                      ▼
                    </button>
                  </div>
                  {p.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.category_name || "Uncategorized"}</p>
                  </div>
                  <button
                    onClick={() => removePick(p.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Add articles</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search published articles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
            />
          </div>
          <div className="max-h-[420px] overflow-y-auto space-y-1">
            {searchLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No articles found.</p>
            ) : (
              searchResults.map((a) => {
                const picked = picks.some((p) => p.id === a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => addPick(a)}
                    disabled={picked}
                    className={`w-full text-left flex items-center gap-2 p-2 rounded-lg ${
                      picked ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "hover:bg-red-50/50"
                    }`}
                  >
                    {a.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.image_url} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-1">{a.title}</p>
                      <p className="text-[11px] text-gray-400">{a.category_name || "Uncategorized"}</p>
                    </div>
                    {picked ? (
                      <span className="text-xs text-gray-400">Added</span>
                    ) : (
                      <Plus className="w-4 h-4 text-gray-300" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Preview</h2>
          <p className="text-xs text-gray-400">
            {previewArticles.length} article{previewArticles.length === 1 ? "" : "s"} included
          </p>
        </div>
        {previewLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : previewHtml ? (
          <iframe
            srcDoc={previewHtml}
            className="w-full h-[600px] border border-gray-200 rounded-xl bg-gray-50"
            sandbox=""
            title="Newsletter preview"
          />
        ) : (
          <p className="text-center text-sm text-gray-400 py-8">
            No content to preview yet.
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  color: "green" | "amber" | "blue" | "gray";
}) {
  const bg = {
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    gray: "bg-gray-100 text-gray-500",
  }[color];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
