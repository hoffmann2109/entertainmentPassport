import type { CollectionItem, MediaType } from './types';

// Helper to standardizing errors
const handleApiError = () => { throw new Error("Unable to retrieve data. Please try again."); };

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
  cover_image_url: img || "https://via.placeholder.com/150?text=No+Image",
  year: year ? parseInt(String(year).substring(0, 4)) : "Data unavailable",
  imported_at: new Date().toISOString(),
  notes: ""
});

export const searchAPI = async (query: string, category: 'movie' | 'tv' | 'game' | 'album'): Promise<CollectionItem[]> => {
  if (!query) return [];
  const results: CollectionItem[] = [];

  try {
    if (category === 'album' || category === 'movie') {
      // API: iTunes Search API (Keyless)
      // Inputs: term (query), media (music/movie), limit
      const entity = category === 'album' ? 'album' : 'movie';
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=${category === 'album' ? 'music' : 'movie'}&entity=${entity}&limit=12`);
      if (!res.ok) handleApiError();
      const data = await res.json();
      
      results.push(...data.results.map((item: any) => normalize(
        String(item.collectionId || item.trackId),
        category,
        item.collectionName || item.trackName,
        item.artistName,
        item.artworkUrl100?.replace('100x100', '600x600'), // Hack for high-res
        item.releaseDate
      )));

    } else if (category === 'tv') {
      // API: TVMaze (Keyless)
      // Inputs: q (query)
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
      // API: CheapShark (Keyless)
      // Inputs: title (query)
      const res = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}&limit=12`);
      if (!res.ok) handleApiError();
      const data = await res.json();

      results.push(...data.map((item: any) => normalize(
        `game-${item.gameID}`, // CheapShark IDs are simple integers
        'game',
        item.external, // Title
        "Various Publishers", // CheapShark doesn't provide dev info easily in search
        item.thumb,
        "Data unavailable" // CheapShark search doesn't return year
      )));
    }
  } catch (error) {
    console.error(error);
    handleApiError();
  }
  
  return results;
};