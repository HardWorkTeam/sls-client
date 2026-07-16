"use client";

import { ImageIcon, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { galleryService } from "@/services/gallery-service";
import { compressImage } from "@/lib/image-compress";

interface ImageUploadProps {
  weddingId: number;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  accept?: string;
  isPublic?: boolean;
}

export function ImageUpload({
  weddingId,
  value,
  onChange,
  placeholder = "Paste image URL…",
  accept = "image/*",
  isPublic = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlMode, setUrlMode] = useState(false);

  const MAX_BYTES = 50 * 1024 * 1024; // 50 MB — matches backend rule

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const processedFile = await compressImage(file);
      if (processedFile.size > MAX_BYTES) {
        setError(`File too large (${(processedFile.size / 1024 / 1024).toFixed(1)} MB). Max 50 MB.`);
        setUploading(false);
        return;
      }
      const item = await galleryService.upload(weddingId, processedFile, { is_public: isPublic });
      onChange(item.url);
    } catch {
      setError("Upload failed — check file type or size.");
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

  return (
    <div className="space-y-1.5">
      {/* Main drop zone / preview */}
      {value && !uploading ? (
        <div className="group relative w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100" style={{ height: 140 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow hover:bg-white"
            >
              <Pencil className="h-3 w-3" />
              Change
            </button>
            <button
              type="button"
              onClick={() => { onChange(""); setUrlMode(false); }}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-rose-600"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && inputRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 transition hover:border-emerald-300 hover:bg-emerald-50/40"
          style={{ height: 120 }}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600">Uploading…</span>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-stone-100">
                <ImageIcon className="h-5 w-5 text-stone-400" />
              </div>
              <div className="text-center leading-tight">
                <p className="text-xs font-semibold text-stone-600">Click to upload</p>
                <p className="text-[10px] text-stone-400">or drag &amp; drop • JPG, PNG, WebP</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* URL input row */}
      <div className="flex items-center gap-1.5">
        {urlMode ? (
          <>
            <input
              autoFocus
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => { if (!value) setUrlMode(false); }}
              placeholder={placeholder}
              className="min-w-0 flex-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs outline-none transition focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={() => setUrlMode(false)}
              className="shrink-0 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-stone-500 hover:bg-stone-50"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setUrlMode(true)}
              className="flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-stone-500 transition hover:bg-stone-50 hover:text-stone-800"
            >
              Paste URL
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-stone-500 transition hover:bg-stone-50 hover:text-stone-800 disabled:opacity-40"
            >
              <Upload className="h-3 w-3" />
              Browse
            </button>
          </>
        )}
      </div>

      {error && <p className="text-[10px] text-red-600">{error}</p>}

      <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={onInputChange} />
    </div>
  );
}
