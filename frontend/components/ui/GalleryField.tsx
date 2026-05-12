"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
import { resolveImageSrc } from "@/lib/safeImage";
import { MediaLibraryModal } from "./MediaLibraryModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

  function handleSelectFromMedia(url: string) {
    if (value.length >= max) return;
    onChange([...value, { url, caption: "" }]);
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
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).style.opacity = "0.2")
                  }
                />
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">
                  <GripVertical className="w-3 h-3" />
                  {idx + 1}
                </span>
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
          Add image ({value.length}/{max})
        </button>
        <p className="text-[11px] text-gray-400">
          Drag tiles to reorder.
        </p>
      </div>

      <MediaLibraryModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSelect={(url) => {
          handleSelectFromMedia(url);
          setModalOpen(false);
        }} 
      />
    </div>
  );
}
