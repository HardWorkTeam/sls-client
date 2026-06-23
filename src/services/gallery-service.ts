import { api } from "@/lib/api";
import type { Album, MediaItem, Paginated } from "@/types/api";

export const galleryService = {
  async albums(weddingId: number): Promise<Album[]> {
    const { data } = await api.get<{ data: Album[] }>(`/weddings/${weddingId}/albums`);
    return data.data;
  },

  async createAlbum(
    weddingId: number,
    payload: { name: string; description?: string | null; is_public?: boolean },
  ): Promise<Album> {
    const { data } = await api.post<{ data: Album }>(
      `/weddings/${weddingId}/albums`,
      payload,
    );
    return data.data;
  },

  async media(
    weddingId: number,
    params: { album_id?: number; media_type?: string; page?: number; per_page?: number } = {},
  ): Promise<Paginated<MediaItem>> {
    const { data } = await api.get<Paginated<MediaItem>>(
      `/weddings/${weddingId}/media`,
      { params },
    );
    return data;
  },

  async upload(
    weddingId: number,
    file: File,
    options: { album_id?: number; is_public?: boolean } = {},
  ): Promise<MediaItem> {
    const form = new FormData();
    form.append("file", file);
    if (options.album_id) form.append("album_id", String(options.album_id));
    if (options.is_public !== undefined)
      form.append("is_public", options.is_public ? "1" : "0");

    const { data } = await api.post<{ data: MediaItem }>(
      `/weddings/${weddingId}/media`,
      form,
    );
    return data.data;
  },

  async patchMedia(
    weddingId: number,
    mediaId: number,
    payload: { is_public: boolean },
  ): Promise<MediaItem> {
    const { data } = await api.patch<{ data: MediaItem }>(
      `/weddings/${weddingId}/media/${mediaId}`,
      payload,
    );
    return data.data;
  },

  async removeMedia(weddingId: number, mediaId: number): Promise<void> {
    await api.delete(`/weddings/${weddingId}/media/${mediaId}`);
  },
};
