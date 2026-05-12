"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import { MediaLibraryModal } from "./MediaLibraryModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
  previewMaxHeight?: string;
}

function resolveUrl(value: string): string {
  if (!value) return value;
  if (value.startsWith("/uploads/")) return `${API}${value}`;
  return value;
}

export function ImageUploadField({
  value,
  onChange,
  placeholder = "https://... or select an image",
  className = "",
  showPreview = true,
  previewMaxHeight = "max-h-48",
}: ImageUploadFieldProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
        />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
          title="Select from Media Library"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Media Library</span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <MediaLibraryModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSelect={(url) => {
          onChange(url);
          setModalOpen(false);
        }} 
      />
      {showPreview && value && (
        <div className="relative w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveUrl(value)}
            alt="Preview"
            className={`w-full h-auto block ${previewMaxHeight} object-contain bg-white`}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}
