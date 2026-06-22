"use client";

import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { galleryService } from "@/services/gallery-service";

interface ImageUploadProps {
  weddingId: number;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  accept?: string;
  /** Show a square thumbnail preview (default true) */
  preview?: boolean;
}

export function ImageUpload({
  weddingId,
  value,
  onChange,
  placeholder = "https://… or upload",
  accept = "image/jpeg,image/png,image/webp",
  preview = true,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const item = await galleryService.upload(weddingId, file, { is_public: true });
      onChange(item.url);
    } catch {
      setError("Upload failed — check file type/size (max 50 MB).");
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="space-y-2">
      {/* URL text input + upload button */}
      <div className="flex gap-1.5">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none transition focus:border-emerald-400 focus:bg-white"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 hover:text-stone-900 disabled:opacity-50"
          title="Upload image"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onInputChange} />
      </div>

      {/* Error */}
      {error && <p className="text-[10px] text-red-600">{error}</p>}

      {/* Preview or dropzone */}
      {preview && (
        value ? (
          <div className="group relative h-24 w-24 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-0.5 text-white group-hover:flex"
              title="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 bg-stone-50 text-stone-400 transition hover:bg-stone-100"
          >
            <ImageIcon className="h-5 w-5" />
            <span className="text-[9px] font-semibold uppercase tracking-widest">Drop</span>
          </div>
        )
      )}
    </div>
  );
}
