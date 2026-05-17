"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Search,
  Check,
  Copy,
  Trash2,
  X,
  FileImage,
  Info,
  Loader2,
  Link as LinkIcon
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MediaItem } from "@/lib/types/media";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function MediaLibrary() {
  const [data, setData] = useState<{ media: MediaItem[]; total: number; page: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("24ghanta_admin_token") : null;

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchMedia = async (p = 1, s = search) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/media?page=${p}&search=${encodeURIComponent(s)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (p === 1) {
          setData(json);
        } else {
          setData(prev => json ? { ...json, media: [...(prev?.media || []), ...json.media] } : prev);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchMedia(1, search);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !token) return;
    setPendingFiles(Array.from(e.target.files));
  };

  const confirmUpload = async () => {
    setUploading(true);
    let successCount = 0;
    for (const file of pendingFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${API}/api/admin/media`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          showToast(`Failed: ${file.name} — ${err.error || "Unknown error"}`, "error");
        } else {
          successCount++;
        }
      } catch (error) {
        console.error("Upload error", error);
        showToast(`Upload failed: ${file.name}`, "error");
      }
    }

    if (successCount > 0) {
      showToast(`${successCount} image${successCount !== 1 ? "s" : ""} uploaded`);
    }
    setUploading(false);
    setPendingFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setPage(1);
    fetchMedia(1, search);
  };

  const cancelUpload = () => {
    setPendingFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalUrl.trim() || !token) return;

    setUploading(true);
    try {
      const res = await fetch(`${API}/api/admin/media/url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: externalUrl.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        showToast(json.error || "Failed to upload from URL", "error");
      } else {
        showToast("Image uploaded from URL");
        setExternalUrl("");
        setShowUrlInput(false);
        setPage(1);
        fetchMedia(1, search);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to process URL upload", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDetails = async (id: string, alt_text: string, caption: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/admin/media/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ alt_text, caption })
      });

      if (res.ok) {
        const { media } = await res.json();
        setData(prev => prev ? {
          ...prev,
          media: prev.media.map(m => m.id === media.id ? media : m)
        } : prev);
        setSelectedMedia(media);
        showToast("Details saved");
      } else {
        showToast("Failed to save details", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to save details", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm("Are you sure you want to permanently delete this media file? It may break articles actively using it.")) return;

    try {
      const res = await fetch(`${API}/api/admin/media/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setData(prev => prev ? {
          ...prev,
          media: prev.media.filter(m => m.id !== id),
          total: prev.total - 1
        } : prev);
        if (selectedMedia?.id === id) {
          setSelectedMedia(null);
        }
        showToast("Media deleted");
      } else {
        showToast("Failed to delete media", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      {/* Header and Toolbar */}
      <div className="bg-white border-b px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Media Library</h1>
          <p className="text-sm text-slate-500">Manage images to embed in your articles.</p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search images or alt text..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>

          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="flex-shrink-0 flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full font-medium text-sm transition-colors shadow-sm"
          >
            <LinkIcon className="w-4 h-4" />
            <span className="hidden sm:inline">From URL</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-medium text-sm transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
          />
        </div>
      </div>

      {/* URL Input Dropdown */}
      {showUrlInput && (
        <form onSubmit={handleUrlSubmit} className="px-4 sm:px-6 py-4 bg-slate-50 border-b flex gap-3 shadow-inner">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            className="flex-1 max-w-xl px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={uploading}
          />
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900 disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Upload URL
          </button>
        </form>
      )}

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 relative flex-grow">
        {loading && page === 1 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square bg-slate-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : data?.media.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FileImage className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-slate-600">No media found</h3>
            <p className="mt-2 text-sm text-slate-500 text-center max-w-sm">
              {search ? "No files match your search query." : "Upload your first image to get started."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
              {data?.media.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer border border-slate-200 hover:ring-4 hover:ring-blue-500/30 transition-all"
                >
                  <Image
                    src={`${API}/uploads/${item.storage_key}`}
                    alt={item.alt_text || item.original_name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                    loading="lazy"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-white text-xs font-medium truncate drop-shadow-md">
                      {item.original_name}
                    </p>
                    <p className="text-white/80 text-[10px] drop-shadow-md mt-0.5">
                      {formatBytes(item.size_bytes)} • {item.width}x{item.height}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {data && data.page < data.totalPages && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchMedia(nextPage, search);
                  }}
                  disabled={loading}
                  className="px-6 py-2 bg-white border shadow-sm rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {loading ? "Loading more..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Slide-out Drawer */}
      {selectedMedia && (
        <MediaDrawer
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onDelete={handleDelete}
          onSave={handleSaveDetails}
          showToast={showToast}
        />
      )}

      {/* Upload Confirmation Modal */}
      {pendingFiles.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Upload</h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to upload <span className="font-semibold text-slate-800">{pendingFiles.length}</span> image{pendingFiles.length !== 1 ? 's' : ''} to the media library?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all",
          toast.type === "error" ? "bg-red-600 text-white" : "bg-slate-800 text-white"
        )}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

/** Media details drawer — bottom sheet on mobile, side panel on desktop */
function MediaDrawer({
  media,
  onClose,
  onDelete,
  onSave,
  showToast,
}: {
  media: MediaItem,
  onClose: () => void,
  onDelete: (id: string) => void,
  onSave: (id: string, alt: string, cap: string) => void,
  showToast: (msg: string, type?: "success" | "error") => void,
}) {
  const [altText, setAltText] = useState(media.alt_text || "");
  const [caption, setCaption] = useState(media.caption || "");
  const [copied, setCopied] = useState(false);

  // Sync state if media changes while drawer is open
  useEffect(() => {
    setAltText(media.alt_text || "");
    setCaption(media.caption || "");
  }, [media]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const relativeUrl = `/uploads/${media.storage_key}`;
  const fullUrl = `${API}/uploads/${media.storage_key}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(relativeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Failed to copy — clipboard unavailable", "error");
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "fixed z-50 overflow-y-auto flex flex-col bg-white shadow-2xl",
          // Mobile: bottom sheet
          "inset-x-0 bottom-0 h-[75vh] rounded-t-2xl border-t",
          // Desktop: side panel
          "sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:h-full sm:w-full sm:max-w-md sm:rounded-none sm:border-l sm:border-t-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Media details"
      >
        {/* Drag handle for mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-slate-50 sticky top-0 z-10">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            Media Details
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-grow flex flex-col gap-5">
          <div className="relative aspect-auto max-h-[200px] sm:max-h-[300px] w-full bg-slate-100 rounded-xl overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fullUrl}
              alt={media.original_name}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex justify-center items-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied URL!" : "Copy URL"}
            </button>
            <button
              onClick={() => { onDelete(media.id); }}
              className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-100 shrink-0 group"
              title="Delete permanently"
            >
              <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </button>
          </div>

          {/* Metadata Block */}
          <div className="bg-slate-50 p-4 rounded-xl text-sm border flex flex-col gap-2 shadow-inner">
            <p><span className="text-slate-500 font-medium">Uploaded on:</span> {new Date(media.created_at).toLocaleString()}</p>
            <p><span className="text-slate-500 font-medium">Original Name:</span> <span className="break-all">{media.original_name}</span></p>
            <p><span className="text-slate-500 font-medium">File Type:</span> {media.mime_type}</p>
            <p><span className="text-slate-500 font-medium">File Size:</span> {(media.size_bytes / 1024).toFixed(1)} KB</p>
            <p><span className="text-slate-500 font-medium">Dimensions:</span> {media.width} x {media.height} px</p>
          </div>

          {/* Edit Form */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Alt Text (SEO)</label>
              <input
                type="text"
                value={altText}
                onChange={e => setAltText(e.target.value)}
                placeholder="Describe this image for screen readers..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Caption (Optional)</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={3}
                placeholder="A visible caption for galleries..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <button
              onClick={() => onSave(media.id, altText, caption)}
              className="mt-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Save Changes
            </button>
            <p className="text-xs text-center text-slate-400">Remember, strong Alt Text improves SEO.</p>
          </div>
        </div>
      </div>
    </>
  );
}
