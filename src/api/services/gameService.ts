import type { CollectionItem } from '../../types/types';
import { handleApiError, normalize } from '../utils';

export const fetchGames = async (query: string): Promise<CollectionItem[]> => {
  const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;

  if (!RAWG_API_KEY) throw new Error("Missing VITE_RAWG_API_KEY in .env file");

  const res = await fetch(
    `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=12`
  );

  if (!res.ok) handleApiError(`RAWG Error: ${res.status}`);

  const data = await res.json();
  if (!data.results || data.results.length === 0) return [];

  return data.results.map((item: any) =>
    normalize(
      String(item.id),
      "game",
      item.name,
      item.genres?.[0]?.name || "Data unavailable",
      item.background_image,
      item.released
    )
  );
};