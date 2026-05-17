"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { X, Search, UploadCloud, Loader2, Link as LinkIcon, FileImage, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MediaItem } from "@/lib/types/media";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  /** Enable multi-select mode with checkboxes and batch insert */
  multiple?: boolean;
  /** Called with all selected URLs when user clicks "Insert N images" in multi mode */
  onSelectMultiple?: (urls: string[]) => void;
}

export function MediaLibraryModal({ isOpen, onClose, onSelect, multiple, onSelectMultiple }: MediaLibraryModalProps) {
  const [data, setData] = useState<{ media: MediaItem[]; total: number; page: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("24ghanta_admin_token") : null;

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set());
    }
  }, [isOpen]);

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
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchMedia(1, search);
    }, 400);
    return () => clearTimeout(timer);
  }, [isOpen, search]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !token) return;
    
    setUploading(true);
    const files = Array.from(e.target.files);
    
    for (const file of files) {
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
          alert(`Failed to upload ${file.name}: ${err.error || 'Unknown error'}`);
        } else {
            const data = await res.json();
            // Automatically select the freshly uploaded image if it's the only one being uploaded
            if (files.length === 1 && data.media) {
                const url = `/uploads/${data.media.storage_key}`;
                if (multiple) {
                  setSelected(prev => new Set(prev).add(url));
                } else {
                  onSelect(url);
                  return;
                }
            }
        }
      } catch (error) {
        console.error("Upload error", error);
      }
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setPage(1);
    fetchMedia(1, search);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (externalUrl.trim()) {
      if (multiple) {
        setSelected(prev => new Set(prev).add(externalUrl.trim()));
      } else {
        onSelect(externalUrl.trim());
      }
      setExternalUrl("");
      setShowUrlInput(false);
    }
  };

  function toggleSelect(url: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function handleInsertSelected() {
    const urls = Array.from(selected);
    if (urls.length === 0) return;
    if (onSelectMultiple) {
      onSelectMultiple(urls);
    } else {
      // Fallback: call onSelect for each
      urls.forEach(url => onSelect(url));
      onClose();
    }
  }

  function handleImageClick(storageKey: string) {
    const url = `/uploads/${storageKey}`;
    if (multiple) {
      toggleSelect(url);
    } else {
      onSelect(url);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[95vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <h2 className="text-xl font-semibold text-slate-800">
            Media Library
            {multiple && selected.size > 0 && (
              <span className="ml-2 text-sm font-normal text-blue-600">
                ({selected.size} selected)
              </span>
            )}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between border-b">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search images..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm hover:bg-slate-50"
            >
              <LinkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">From URL</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              Upload
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
          <form onSubmit={handleUrlSubmit} className="px-6 py-3 bg-slate-50 border-b flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900">
              {multiple ? "Add to selection" : "Insert"}
            </button>
          </form>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {loading && page === 1 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-square bg-slate-200 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : data?.media.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FileImage className="w-16 h-16 mb-4 opacity-50" />
              <p>No media found.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {data?.media.map(item => {
                  const url = `/uploads/${item.storage_key}`;
                  const isSelected = selected.has(url);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleImageClick(item.storage_key)}
                      className={cn(
                        "group relative aspect-square bg-white rounded-xl overflow-hidden cursor-pointer border transition-all",
                        isSelected
                          ? "border-blue-500 ring-2 ring-blue-500/30"
                          : "hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20"
                      )}
                    >
                      <Image
                        src={`${API}/uploads/${item.storage_key}`}
                        alt={item.alt_text || item.original_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        unoptimized
                      />
                      {/* Selection checkbox overlay for multi mode */}
                      {multiple && (
                        <div className={cn(
                          "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10",
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-black/40 text-white/70 opacity-0 group-hover:opacity-100"
                        )}>
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-medium truncate">{item.original_name}</p>
                      </div>
                    </div>
                  );
                })}
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
                    className="px-6 py-2 bg-white border rounded-full text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Multi-select footer */}
        {multiple && selected.size > 0 && (
          <div className="px-6 py-3 border-t bg-white flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {selected.size} image{selected.size !== 1 ? "s" : ""} selected
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set())}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleInsertSelected}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Insert {selected.size} image{selected.size !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}