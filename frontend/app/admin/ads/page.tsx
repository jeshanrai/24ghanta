"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  RotateCcw,
  Edit3,
  X,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { resolveImageSrc } from "@/lib/safeImage";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Placement {
  value: string;
  label: string;
  /** Recommended pixel dimensions (drives validation tolerance). */
  width: number;
  height: number;
  /** Friendly description shown beneath the field. */
  note?: string;
}

// Single source of truth for recommended ad sizes. The form computes the
// target aspect ratio from width/height, then warns if the uploaded image
// is more than ~25% off either dimension. Admin can still save — it's a
// soft warning, not a hard reject — but the layout will look weird.
const PLACEMENTS: Placement[] = [
  { value: "category_header_banner",   label: "Category header banner (above title)",            width: 1200, height: 180, note: "Stretches above category titles." },
  { value: "between_sections",         label: "Between Sports & Business (Left)",                width: 728,  height: 180 },
  { value: "between_sections_right",   label: "Between Sports & Business (Right)",               width: 728,  height: 180 },
  { value: "just_in_sports_left",      label: "Between Just In & Sports (Left)",                 width: 300,  height: 250 },
  { value: "just_in_sports_right",     label: "Between Just In & Sports (Right)",                width: 300,  height: 250 },
  { value: "article_inline",           label: "Article inline (mid-body)",                       width: 336,  height: 280 },
  { value: "article_sidebar",          label: "Article sidebar",                                 width: 300,  height: 150, note: "IAB MPU half." },
  { value: "article_more_in_category", label: "Article — More in category (in-list)",            width: 300,  height: 122 },
  { value: "article_related_stories",  label: "Article — Related stories (in-list)",             width: 300,  height: 122 },
  { value: "in_feed_list",             label: "In-feed list (after every 3rd article)",          width: 600,  height: 192, note: "Matches the row layout used on category and sidebar lists. Animated GIFs allowed." },
  { value: "footer_banner",            label: "Footer banner",                                   width: 728,  height: 90  },
  { value: "popup_landing",            label: "Landing popup",                                   width: 600,  height: 450 },
  { value: "mobile_sticky",            label: "Mobile sticky bottom",                            width: 320,  height: 50  },
  { value: "poll_sidebar",             label: "Poll sidebar (below options)",                    width: 300,  height: 150 },
];

function placementFor(value: string): Placement | undefined {
  return PLACEMENTS.find((p) => p.value === value);
}

interface Ad {
  id: number;
  name: string;
  placement: string;
  ad_type: "image" | "html";
  image_url: string | null;
  link_url: string | null;
  alt_text: string | null;
  html_content: string | null;
  is_active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  impressions: number;
  clicks: number;
}

export default function AdminAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [placement, setPlacement] = useState(PLACEMENTS[0].value);
  const [adType, setAdType] = useState<"image" | "html">("image");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(0);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Measured dimensions of the currently-chosen ad image. `null` until the
  // image loads; populated in the effect below. Used purely for UX feedback
  // — admin can still save a mis-sized image (some campaigns deliberately
  // do this), they just see a yellow warning.
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("24ghanta_admin_token")
      : null;

  const fetchAds = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/ads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Surface the actual server response so 401/403/500 is distinguishable.
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ""}`);
      }
      const data = await res.json();
      setAds(data.data || []);
    } catch (err) {
      console.error("Failed to load ads:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAds();
    // Live counter refresh — pull updated impressions/clicks every 15s.
    // Pauses while the create/edit modal is open so the form state isn't disturbed.
    const id = setInterval(() => {
      if (!showForm) fetchAds();
    }, 15_000);
    return () => clearInterval(id);
  }, [fetchAds, showForm]);

  // Measure the chosen image whenever the URL changes. Resolves /uploads/...
  // paths to absolute URLs so the in-browser <img> can fetch from the API
  // origin (the admin frontend runs on a different port in dev).
  useEffect(() => {
    if (adType !== "image" || !imageUrl) {
      setImageDims(null);
      return;
    }
    const src = imageUrl.startsWith("/uploads/") ? `${API}${imageUrl}` : imageUrl;
    const img = new Image();
    img.onload = () => setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => setImageDims(null);
    img.src = src;
    return () => {
      // Detach handlers so a stale load can't clobber a newer measurement.
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl, adType]);

  function resetForm() {
    setName("");
    setPlacement(PLACEMENTS[0].value);
    setAdType("image");
    setImageUrl("");
    setLinkUrl("");
    setAltText("");
    setHtmlContent("");
    setIsActive(true);
    setPriority(0);
    setStartsAt("");
    setEndsAt("");
    setImageDims(null);
    setFormError(null);
    setEditing(null);
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(ad: Ad) {
    setEditing(ad);
    setName(ad.name);
    setPlacement(ad.placement);
    setAdType(ad.ad_type);
    setImageUrl(ad.image_url || "");
    setLinkUrl(ad.link_url || "");
    setAltText(ad.alt_text || "");
    setHtmlContent(ad.html_content || "");
    setIsActive(ad.is_active);
    setPriority(ad.priority);
    setStartsAt(ad.starts_at ? ad.starts_at.slice(0, 16) : "");
    setEndsAt(ad.ends_at ? ad.ends_at.slice(0, 16) : "");
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!name.trim()) return setFormError("Name is required");
    if (adType === "image" && !imageUrl.trim())
      return setFormError("Image URL is required for image ads");
    if (adType === "html" && !htmlContent.trim())
      return setFormError("HTML content is required for html ads");

    setSaving(true);
    setFormError(null);

    try {
      const body = {
        name: name.trim(),
        placement,
        ad_type: adType,
        image_url: imageUrl.trim() || null,
        link_url: linkUrl.trim() || null,
        alt_text: altText.trim() || null,
        html_content: htmlContent.trim() || null,
        is_active: isActive,
        priority,
        starts_at: startsAt || null,
        ends_at: endsAt || null,
      };

      const url = editing
        ? `${API}/api/admin/ads/${editing.id}`
        : `${API}/api/admin/ads`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save ad");
      }
      setShowForm(false);
      resetForm();
      fetchAds();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(ad: Ad) {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/admin/ads/${ad.id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      fetchAds();
    } catch {
      alert("Failed to toggle");
    }
  }

  async function handleReset(ad: Ad) {
    const ok = await confirmAction({
      title: "Reset ad stats?",
      message: (
        <>
          Impressions and clicks for{" "}
          <span className="font-semibold">{ad.name}</span> will be reset to zero.
        </>
      ),
      confirmLabel: "Reset stats",
      variant: "warning",
    });
    if (!ok || !token) return;
    try {
      const res = await fetch(`${API}/api/admin/ads/${ad.id}/reset`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      fetchAds();
    } catch {
      alert("Failed to reset stats");
    }
  }

  async function handleDelete(ad: Ad) {
    const ok = await confirmAction({
      title: "Delete ad?",
      message: (
        <>
          This will permanently delete{" "}
          <span className="font-semibold">{ad.name}</span>. This cannot be
          undone.
        </>
      ),
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok || !token) return;
    try {
      const res = await fetch(`${API}/api/admin/ads/${ad.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setAds((prev) => prev.filter((a) => a.id !== ad.id));
    } catch {
      alert("Failed to delete");
    }
  }

  function placementLabel(value: string) {
    return PLACEMENTS.find((p) => p.value === value)?.label || value;
  }

  function ctr(ad: Ad) {
    if (ad.impressions === 0) return "0%";
    return `${((ad.clicks / ad.impressions) * 100).toFixed(1)}%`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Advertisements
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage ads shown across the site. Schedule them, prioritize the
            winner per slot, and track performance.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all"
        >
          <Plus className="w-4 h-4" /> New Ad
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : ads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-20">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No ads yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first ad to start monetising the site
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className={`bg-white rounded-2xl border p-5 transition-all ${ad.is_active
                  ? "border-green-200 shadow-sm shadow-green-100"
                  : "border-gray-100"
                }`}
            >
              <div className="flex items-start gap-4">
                {ad.ad_type === "image" && ad.image_url ? (
                  <div className="w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveImageSrc(ad.image_url)}
                      alt={ad.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-16 shrink-0 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-blue-700">
                      HTML
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${ad.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${ad.is_active ? "bg-green-500" : "bg-gray-400"
                          }`}
                      />
                      {ad.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Priority {ad.priority}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">
                    {ad.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {placementLabel(ad.placement)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-50 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    Impressions
                  </p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">
                    {ad.impressions.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    Clicks
                  </p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">
                    {ad.clicks.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    CTR
                  </p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">
                    {ctr(ad)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 border-t border-gray-50 pt-3 mt-3">
                <div className="px-2 py-1" title={ad.is_active ? "Deactivate" : "Activate"}>
                  <ToggleSwitch
                    checked={ad.is_active}
                    onChange={() => handleToggle(ad)}
                  />
                </div>
                <button
                  onClick={() => openEdit(ad)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReset(ad)}
                  className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Reset stats"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                {ad.link_url && (
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Open click-through URL"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => handleDelete(ad)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {editing ? "Edit Ad" : "Create New Ad"}
                </h3>
                <p className="text-xs text-gray-500">
                  Configure where, when, and how this ad appears
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name (internal)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Summer Subscription Promo"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Placement
                  </label>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  >
                    {PLACEMENTS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const p = placementFor(placement);
                    if (!p) return null;
                    return (
                      <p className="text-[11px] text-gray-400 mt-1">
                        Recommended size: <strong className="text-gray-600">{p.width}×{p.height}px</strong>
                        {p.note ? ` — ${p.note}` : ""}
                      </p>
                    );
                  })()}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ad type
                  </label>
                  <select
                    value={adType}
                    onChange={(e) =>
                      setAdType(e.target.value as "image" | "html")
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="image">Image (banner)</option>
                    <option value="html">HTML / embed code</option>
                  </select>
                </div>
              </div>

              {adType === "image" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Image URL
                    </label>
                    <ImageUploadField
                      value={imageUrl}
                      onChange={setImageUrl}
                      placeholder="https://example.com/banner.webp"
                    />
                    {imageUrl && (
                      <DimensionFeedback
                        dims={imageDims}
                        target={placementFor(placement)}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Click-through URL{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://advertiser.example.com/landing"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Alt text{" "}
                      <span className="text-gray-400 font-normal">
                        (accessibility)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="Describe the ad image"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    HTML / embed code
                  </label>
                  <textarea
                    rows={6}
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="<script>...</script> or <ins class='adsbygoogle'>..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                  <div className="flex items-start gap-2 mt-2 text-xs text-orange-600 bg-orange-50 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      HTML/script ads are rendered as raw markup. Only paste
                      content from sources you trust (e.g., AdSense, your own
                      embeds).
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Higher wins when multiple ads share a slot
                  </p>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Active</p>
                    <p className="text-xs text-gray-400">
                      Inactive ads are not served
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={isActive}
                    onChange={() => setIsActive(!isActive)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Starts at{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ends at{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editing ? "Update Ad" : "Create Ad"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Shows the measured image dimensions alongside the recommended ones, with a
 * yellow warning when the aspect ratio is significantly off (≥25%). We don't
 * block saving — some campaigns intentionally use non-standard sizes — but
 * we surface the mismatch loudly because the page layout reserves a fixed
 * aspect-ratio box and a wrong image gets letterboxed or cropped hard.
 */
function DimensionFeedback({
  dims,
  target,
}: {
  dims: { width: number; height: number } | null;
  target?: Placement;
}) {
  if (!dims) {
    return (
      <p className="text-[11px] text-gray-400 mt-1.5">
        Measuring image…
      </p>
    );
  }
  if (!target) {
    return (
      <p className="text-[11px] text-gray-500 mt-1.5">
        Image is {dims.width}×{dims.height}px.
      </p>
    );
  }
  const actualAspect = dims.width / dims.height;
  const targetAspect = target.width / target.height;
  // ±25% aspect deviation is the threshold — chosen because a 728×180
  // banner uploaded as 728×220 still works fine, but 728×400 would crop.
  const ratioDiff = Math.abs(actualAspect - targetAspect) / targetAspect;
  const mismatch = ratioDiff > 0.25;
  return (
    <div
      className={`mt-1.5 text-[11px] rounded-lg px-2.5 py-1.5 flex items-start gap-1.5 ${
        mismatch ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-green-50 text-green-700 border border-green-100"
      }`}
    >
      {mismatch ? <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
      <span>
        Uploaded: <strong>{dims.width}×{dims.height}px</strong> · Recommended: <strong>{target.width}×{target.height}px</strong>
        {mismatch && (
          <> — aspect ratio is off by {Math.round(ratioDiff * 100)}%. The slot will crop or letterbox.</>
        )}
      </span>
    </div>
  );
}
