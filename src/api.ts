import type { CollectionItem, MediaType } from "./types/types";

// Helper: Standardize Errors
const handleApiError = (msg?: string) => {
  throw new Error(msg || "Unable to retrieve data. Please try again.");
};

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
  cover_image_url:
    img && img !== "N/A" ? img : "https://placehold.co/400x600?text=No+Image",
  year: year ? parseInt(String(year).substring(0, 4)) : "Data unavailable",
  imported_at: new Date().toISOString(),
  notes: "",
});

// --- Main Search Function ---

export const searchAPI = async (
  query: string,
  category: "movie" | "tv" | "game" | "album"
): Promise<CollectionItem[]> => {
  if (!query) return [];
  const results: CollectionItem[] = [];

  try {
    switch (category) {
      case "movie":
        const movies = await fetchMovies(query);
        results.push(...movies);
        break;
      case "game":
        const games = await fetchGames(query);
        results.push(...games);
        break;
      case "album":
        const albums = await fetchAlbums(query);
        results.push(...albums);
        break;
      case "tv":
        const shows = await fetchShows(query);
        results.push(...shows);
        break;
    }
  } catch (error) {
    console.error("Search API Error:", error);
    // Rethrow to allow the UI to display the specific error (e.g. missing API key)
    throw error;
  }

  return results;
};

// --- API Fetchers ---

const fetchMovies = async (query: string): Promise<CollectionItem[]> => {
  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  if (!TMDB_API_KEY) throw new Error("Missing VITE_TMDB_API_KEY in .env file");

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
    query
  )}&page=1`;

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
      item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : "",
      item.release_date ? item.release_date.substring(0, 4) : "Data unavailable"
    )
  );
};

const fetchGames = async (query: string): Promise<CollectionItem[]> => {
  const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;

  if (!RAWG_API_KEY) throw new Error("Missing VITE_RAWG_API_KEY in .env file");

  const res = await fetch(
    `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(
      query
    )}&page_size=12`
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

const fetchAlbums = async (query: string): Promise<CollectionItem[]> => {
  // API: iTunes (Cache-Busting Proxy)
  const targetUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
    query
  )}&media=music&entity=album&limit=12`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
    targetUrl
  )}&timestamp=${Date.now()}`;

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

const fetchShows = async (query: string): Promise<CollectionItem[]> => {
  // API: TVMaze
  const res = await fetch(
    `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) handleApiError(`TVMaze Error: ${res.status}`);

  const data = await res.json();

  // TVMaze returns a direct array, not { results: [] }
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