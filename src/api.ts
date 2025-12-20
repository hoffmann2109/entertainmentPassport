import type { CollectionItem, MediaType } from './types';

// Helper: Standardize Errors
const handleApiError = (msg?: string) => { throw new Error(msg || "Unable to retrieve data. Please try again."); };

// Standardizer function
const normalize = (
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
  cover_image_url: img || "https://placehold.co/400x600?text=No+Image", 
  year: year ? parseInt(String(year).substring(0, 4)) : "Data unavailable",
  imported_at: new Date().toISOString(),
  notes: ""
});

export const searchAPI = async (query: string, category: 'movie' | 'tv' | 'game' | 'album'): Promise<CollectionItem[]> => {
  if (!query) return [];
  const results: CollectionItem[] = [];

  try {
    if (category === 'movie') {
      // API: TMDb (The Movie Database)
      const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
      
      if (!TMDB_API_KEY) {
        throw new Error("TMDb API key not found in environment variables");
      }

      const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`;
      
      const res = await fetch(url);
      if (!res.ok) handleApiError();
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        results.push(...data.results.map((item: any) => normalize(
          String(item.id),
          'movie',
          item.title,
          "N/A", // Basic search doesn't include director; use item.overview for description if needed
          item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
          item.release_date ? item.release_date.substring(0, 4) : "Data unavailable"
        )));
      }

    } else if (category === 'album') {
      // API: iTunes (Cache-Busting Proxy)
      const targetUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=album&limit=12`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}&timestamp=${Date.now()}`;

      const res = await fetch(proxyUrl);
      if (!res.ok) handleApiError();
      const data = await res.json();
      
      if (data.results) {
        results.push(...data.results.map((item: any) => normalize(
          String(item.collectionId),
          'album',
          item.collectionName,
          item.artistName,
          item.artworkUrl100?.replace('100x100', '600x600'), 
          item.releaseDate
        )));
      }

    } else if (category === 'tv') {
      // API: TVMaze
      const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
      if (!res.ok) handleApiError();
      const data = await res.json();

      results.push(...data.map((item: any) => normalize(
        String(item.show.id),
        'tv',
        item.show.name,
        item.show.network?.name || "Unknown Network",
        item.show.image?.medium,
        item.show.premiered
      )));

    } else if (category === 'game') {
      // API: CheapShark
      const res = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}&limit=12`);
      if (!res.ok) handleApiError();
      const data = await res.json();

      results.push(...data.map((item: any) => normalize(
        `game-${item.gameID}`, 
        'game',
        item.external, 
        "Various Publishers", 
        item.thumb,
        "Data unavailable" 
      )));
    }
  } catch (error) {
    console.error("Search API Error:", error);
    handleApiError();
  }
  
  return results;
};