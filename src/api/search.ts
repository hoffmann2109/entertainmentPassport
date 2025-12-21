import type { CollectionItem } from '../types/types';
import { fetchMovies } from './services/movieService';
import { fetchGames } from './services/gameService';
import { fetchAlbums } from './services/albumService';
import { fetchShows } from './services/tvService';

export const searchAPI = async (
  query: string,
  category: "movie" | "tv" | "game" | "album"
): Promise<CollectionItem[]> => {
  if (!query) return [];
  const results: CollectionItem[] = [];

  try {
    switch (category) {
      case "movie":
        results.push(...(await fetchMovies(query)));
        break;
      case "game":
        results.push(...(await fetchGames(query)));
        break;
      case "album":
        results.push(...(await fetchAlbums(query)));
        break;
      case "tv":
        results.push(...(await fetchShows(query)));
        break;
    }
  } catch (error) {
    console.error("Search API Error:", error);
    // Rethrow ensures the UI can display "Missing API Key" errors instead of a generic message
    throw error;
  }

  return results;
};