import Dexie, { type Table } from 'dexie';
import type { CollectionItem } from './types/types';

class EntertainmentPassportDB extends Dexie {
  items!: Table<CollectionItem>;

  constructor() {
    super('EntertainmentPassportDB');
    // Primary key: id. Indexes: type, title (for duplication checks)
    this.version(1).stores({
      items: 'id, type, title, artist_or_producer, year, imported_at'
    });
  }
}

export const db = new EntertainmentPassportDB();

// Backend Logic: Check for duplicates before import
export const checkDuplicate = async (id: string, title: string): Promise<boolean> => {
  const byId = await db.items.get(id);
  if (byId) return true;
  
  // Secondary check by title just in case ID schema changes between API calls
  const byTitle = await db.items.where({ title }).first();
  return !!byTitle;
};