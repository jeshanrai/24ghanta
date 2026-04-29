"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";

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
  placeholder = "https://... or upload a .webp",
  className = "",
  showPreview = true,
  previewMaxHeight = "max-h-48",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    const isWebp =
      file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp");
    if (!isWebp) {
      setError("Only .webp images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB");
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("24ghanta_admin_token")
        : null;
    if (!token) {
      setError("Not signed in");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(`${API}/api/uploads/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Upload failed");
      onChange(json.data.url as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

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
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap"
          title="Upload .webp image"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {uploading ? "Uploading…" : "Upload .webp"}
          </span>
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
      <input
        ref={inputRef}
        type="file"
        accept="image/webp,.webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
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
