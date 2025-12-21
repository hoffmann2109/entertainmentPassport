import type { CollectionItem } from '../../types/types';
import { handleApiError, normalize } from '../utils';

export const fetchMovies = async (query: string): Promise<CollectionItem[]> => {
  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  if (!TMDB_API_KEY) throw new Error("Missing VITE_TMDB_API_KEY in .env file");

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`;

  const res = await fetch(url);
  if (!res.ok) handleApiError(`TMDB API Error: ${res.status}`);

  const data = await res.json();
  if (!data.results || data.results.length === 0) return [];

  return data.results.map((item: any) =>
    normalize(
      String(item.id),
      "movie",
      item.title,
      "N/A",
      item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
      item.release_date ? item.release_date.substring(0, 4) : "Data unavailable"
    )
  );
};