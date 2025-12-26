import type { CollectionItem } from '../../types/types';
import { normalize } from '../utils';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

// 1. Helper to get the temporary access token
const getAccessToken = async () => {
  const auth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  const data = await res.json();
  return data.access_token;
};

// 2. The new fetch function
export const fetchAlbums = async (query: string): Promise<CollectionItem[]> => {
  try {
    const token = await getAccessToken(); // In a real app, cache this token!

    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=12`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) throw new Error(`Spotify Error: ${res.status}`);

    const data = await res.json();
    
    // Map Spotify structure to your app structure
    return data.albums.items.map((item: any) => 
      normalize(
        item.id,
        "album",
        item.name,
        item.artists[0]?.name || "Unknown Artist",
        item.images[0]?.url, // Spotify always provides 3 sizes. [0] is the biggest (usually 640x640)
        item.release_date // Format is usually YYYY-MM-DD
      )
    );

  } catch (error) {
    console.error(error);
    return [];
  }
};