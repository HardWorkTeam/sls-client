"use client";

import { Download, Eye, EyeOff, FolderPlus, Trash2, Upload, Video } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";
import {
  useAlbums,
  useCreateAlbum,
  useDeleteMedia,
  useMedia,
  useToggleMediaPublic,
  useUploadMedia,
} from "@/hooks/use-gallery";
import { apiErrorMessage } from "@/lib/api";

interface AlbumForm {
  name: string;
  description: string;
  is_public: boolean;
}

export function GalleryTab({ weddingId }: { weddingId: number }) {
  const [albumId, setAlbumId] = useState("");
  const [page, setPage] = useState(1);
  const [albumDialog, setAlbumDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: albums } = useAlbums(weddingId);
  const { data: media, isLoading } = useMedia(weddingId, {
    album_id: albumId ? Number(albumId) : undefined,
    page,
  });
  const createAlbum = useCreateAlbum(weddingId);
  const uploadMedia = useUploadMedia(weddingId);
  const togglePublic = useToggleMediaPublic(weddingId);
  const deleteMedia = useDeleteMedia(weddingId);

  const form = useForm<AlbumForm>({
    defaultValues: { name: "", description: "", is_public: false },
  });

  const onCreateAlbum = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await createAlbum.mutateAsync(values);
      form.reset();
      setAlbumDialog(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  const onUpload = async (files: FileList) => {
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadMedia.mutateAsync({
          file,
          options: albumId ? { album_id: Number(albumId) } : undefined,
        });
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          className="w-52"
          value={albumId}
          onChange={(event) => {
            setAlbumId(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All albums</option>
          {(albums ?? []).map((album) => (
            <option key={album.id} value={album.id}>
              {album.name} ({album.media_items_count ?? 0})
            </option>
          ))}
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAlbumDialog(true)}>
            <FolderPlus className="h-4 w-4" /> New Album
          </Button>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.length) onUpload(event.target.files);
              event.target.value = "";
            }}
          />
          <Button
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={uploadMedia.isPending}
          >
            <Upload className="h-4 w-4" />
            {uploadMedia.isPending ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {isLoading ? (
        <PageLoader label="Loading media..." />
      ) : !media || media.data.length === 0 ? (
        <EmptyState
          title="No photos or videos"
          description="Upload photos and videos to build the wedding gallery."
          action={
            <Button onClick={() => fileInput.current?.click()}>
              <Upload className="h-4 w-4" /> Upload
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {media.data.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
              >
                {item.media_type === "video" ? (
                  <div className="flex aspect-square items-center justify-center bg-zinc-800">
                    <Video className="h-10 w-10 text-zinc-400" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail_url ?? item.url}
                    alt={item.original_name ?? "Wedding photo"}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-xs text-white">{item.original_name}</p>
                  <div className="flex gap-1">
                    <a
                      href={item.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-white/20 p-1 text-white hover:bg-white/40"
                      aria-label="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      className={`rounded p-1 text-white ${item.is_public ? "bg-emerald-500/70 hover:bg-emerald-600" : "bg-white/20 hover:bg-emerald-500/70"}`}
                      aria-label={item.is_public ? "Hide from invitation" : "Show on invitation"}
                      title={item.is_public ? "Hide from invitation" : "Show on invitation"}
                      onClick={() =>
                        togglePublic.mutate({ mediaId: item.id, isPublic: !item.is_public })
                      }
                    >
                      {item.is_public ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="rounded bg-white/20 p-1 text-white hover:bg-red-500"
                      aria-label="Delete media"
                      onClick={() => {
                        if (confirm("Delete this media item?")) {
                          deleteMedia.mutate(item.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {item.is_public ? (
                  <Badge className="absolute left-2 top-2" variant="success">
                    Public
                  </Badge>
                ) : null}
              </div>
            ))}
          </div>
          <Pagination meta={media.meta} onPageChange={setPage} />
        </>
      )}

      <Dialog open={albumDialog} onClose={() => setAlbumDialog(false)} title="New Album">
        <form onSubmit={onCreateAlbum} className="space-y-3">
          <div>
            <Label htmlFor="album-name">Album name</Label>
            <Input id="album-name" {...form.register("name", { required: true })} />
          </div>
          <div>
            <Label htmlFor="album-description">Description</Label>
            <Input id="album-description" {...form.register("description")} />
          </div>
          <div className="flex items-center gap-2">
            <input id="album-public" type="checkbox" {...form.register("is_public")} />
            <Label htmlFor="album-public">Visible on public invitation</Label>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAlbumDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAlbum.isPending}>
              Create Album
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
