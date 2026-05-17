"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Image as ImageIcon, ImageOff } from "lucide-react";
import { resolveImageSrc } from "@/lib/safeImage";
import { MediaLibraryModal } from "./MediaLibraryModal";

export interface GalleryItem {
  url: string;
  caption?: string;
}

interface GalleryFieldProps {
  value: GalleryItem[];
  onChange: (next: GalleryItem[]) => void;
  max?: number;
}

export function GalleryField({ value, onChange, max = 24 }: GalleryFieldProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function handleBatchSelect(urls: string[]) {
    const remaining = max - value.length;
    if (remaining <= 0) return;
    const newItems = urls.slice(0, remaining).map(url => ({ url, caption: "" }));
    onChange([...value, ...newItems]);
  }

  function update(idx: number, patch: Partial<GalleryItem>) {
    const next = value.map((g, i) => (i === idx ? { ...g, ...patch } : g));
    onChange(next);
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
          <ImageIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
          No gallery images yet. Select one or more images from the Media Library
          to display below the article body.
        </div>
      )}

      {value.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {value.map((g, idx) => (
            <li
              key={`${g.url}-${idx}`}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIdx !== null) move(dragIdx, idx);
                setDragIdx(null);
              }}
              className="relative bg-white border border-gray-200 rounded-xl overflow-hidden group"
            >
              <div className="aspect-[4/3] bg-gray-50 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveImageSrc(g.url)}
                  alt={g.caption || `Gallery image ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = "none";
                    const fallback = el.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                {/* Broken image fallback — hidden by default, shown via onError */}
                <div className="absolute inset-0 flex-col items-center justify-center bg-gray-100 text-gray-400 gap-1" style={{ display: "none" }}>
                  <ImageOff className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Image not found</span>
                </div>
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">
                    <GripVertical className="w-3 h-3" />
                    {idx + 1}
                  </span>
                </div>
                {/* Move up/down buttons for touch devices */}
                <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => move(idx, idx - 1)}
                      className="p-1 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {idx < value.length - 1 && (
                    <button
                      type="button"
                      onClick={() => move(idx, idx + 1)}
                      className="p-1 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={g.caption || ""}
                onChange={(e) => update(idx, { caption: e.target.value })}
                placeholder="Caption (optional)"
                className="w-full px-3 py-2 text-xs border-t border-gray-100 focus:outline-none focus:bg-red-50/30"
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={value.length >= max}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add images ({value.length}/{max})
        </button>
        <p className="text-[11px] text-gray-400">
          Drag tiles to reorder · Use ↑↓ on touch
        </p>
      </div>

      <MediaLibraryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        multiple
        onSelect={(url) => {
          handleBatchSelect([url]);
          setModalOpen(false);
        }}
        onSelectMultiple={(urls) => {
          handleBatchSelect(urls);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
