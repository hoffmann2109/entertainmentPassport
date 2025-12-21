import type { CollectionItem, MediaType } from '../types/types';

export const handleApiError = (msg?: string) => {
  throw new Error(msg || "Unable to retrieve data. Please try again.");
};

export const normalize = (
  id: string,
  type: MediaType,
  title: string,
  artist: string,
  img: string,
  year: string | number
): CollectionItem => ({
  id,
  type,
  title: title || "Data unavailable",
  artist_or_producer: artist || "Data unavailable",
  cover_image_url:
    img && img !== "N/A" ? img : "https://placehold.co/400x600?text=No+Image",
  year: year ? parseInt(String(year).substring(0, 4)) : "Data unavailable",
  imported_at: new Date().toISOString(),
  notes: "",
});