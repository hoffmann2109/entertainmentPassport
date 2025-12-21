import type { CollectionItem } from '../../types/types';
import { handleApiError, normalize } from '../utils';

export const fetchBooks = async (query: string): Promise<CollectionItem[]> => {
  // You can technically use this API without a key, but adding one avoids rate limits.
  // Add VITE_GOOGLE_BOOKS_API_KEY=your_key_here to your .env file
  const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  
  // Optional: Remove this check if you want to try free/keyless access first
  if (!GOOGLE_BOOKS_API_KEY) throw new Error("Missing VITE_GOOGLE_BOOKS_API_KEY in .env file");

  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=12`;

  const res = await fetch(url);
  if (!res.ok) handleApiError(`Google Books Error: ${res.status}`);

  const data = await res.json();

  if (!data.items || data.items.length === 0) return [];

  return data.items.map((item: any) => {
    const info = item.volumeInfo;
    return normalize(
      String(item.id),
      "book",
      info.title,
      info.authors ? info.authors.join(", ") : "Unknown Author",
      // Google images are often http, replace to https to avoid mixed content warnings
      info.imageLinks?.thumbnail?.replace('http:', 'https:') || "", 
      info.publishedDate // Returns "2005-01-01" or just "2005"
    );
  });
};