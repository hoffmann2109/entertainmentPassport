export type MediaType = 'movie' | 'tv' | 'game' | 'album' | 'book';

export interface CollectionItem {
  id: string; // Unique ID (mapped from API source)
  type: MediaType;
  title: string;
  artist_or_producer: string;
  cover_image_url: string;
  year: string | number;
  imported_at: string; // ISO8601
  notes?: string;
}

export type SortOption = 'added' | 'title' | 'year';