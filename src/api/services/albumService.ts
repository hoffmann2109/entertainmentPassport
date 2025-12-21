import type { CollectionItem } from '../../types/types';
import { handleApiError, normalize } from '../utils';

export const fetchAlbums = async (query: string): Promise<CollectionItem[]> => {
  const targetUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=album&limit=12`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}&timestamp=${Date.now()}`;

  const res = await fetch(proxyUrl);
  if (!res.ok) handleApiError(`iTunes Error: ${res.status}`);

  const data = await res.json();
  if (!data.results || data.results.length === 0) return [];

  return data.results.map((item: any) =>
    normalize(
      String(item.collectionId),
      "album",
      item.collectionName,
      item.artistName,
      item.artworkUrl100?.replace("100x100", "600x600"),
      item.releaseDate
    )
  );
};