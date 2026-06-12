"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { galleryService } from "@/services/gallery-service";

export const galleryKeys = {
  all: (weddingId: number) => ["weddings", weddingId, "gallery"] as const,
  albums: (weddingId: number) => ["weddings", weddingId, "gallery", "albums"] as const,
  media: (weddingId: number, params: object) =>
    ["weddings", weddingId, "gallery", "media", params] as const,
};

export function useAlbums(weddingId: number) {
  return useQuery({
    queryKey: galleryKeys.albums(weddingId),
    queryFn: () => galleryService.albums(weddingId),
    enabled: weddingId > 0,
  });
}

export function useMedia(
  weddingId: number,
  params: { album_id?: number; media_type?: string; page?: number } = {},
) {
  return useQuery({
    queryKey: galleryKeys.media(weddingId, params),
    queryFn: () => galleryService.media(weddingId, params),
    enabled: weddingId > 0,
  });
}

export function useCreateAlbum(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string | null; is_public?: boolean }) =>
      galleryService.createAlbum(weddingId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: galleryKeys.all(weddingId) }),
  });
}

export function useUploadMedia(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      options,
    }: {
      file: File;
      options?: { album_id?: number; is_public?: boolean };
    }) => galleryService.upload(weddingId, file, options),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: galleryKeys.all(weddingId) }),
  });
}

export function useDeleteMedia(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: number) => galleryService.removeMedia(weddingId, mediaId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: galleryKeys.all(weddingId) }),
  });
}
