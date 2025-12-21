import type { CollectionItem } from '../../types/types';
import { handleApiError, normalize } from '../utils';

export const fetchShows = async (query: string): Promise<CollectionItem[]> => {
  const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
  
  if (!res.ok) handleApiError(`TVMaze Error: ${res.status}`);

  const data = await res.json();
  if (!data || data.length === 0) return [];

  return data.map((item: any) =>
    normalize(
      String(item.show.id),
      "tv",
      item.show.name,
      item.show.network?.name || "Unknown Network",
      item.show.image?.medium,
      item.show.premiered
    )
  );
};