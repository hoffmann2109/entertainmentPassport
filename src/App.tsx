import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import 'bootstrap/dist/css/bootstrap.min.css';
import { db, checkDuplicate } from './db/db';
import { searchAPI } from './api/search';
import type { CollectionItem, MediaType, SortOption } from './types/types';
import { AppControls } from './components/AppControls';
import { MediaCard } from './components/MediaCard';

const STORAGE_KEY_VIEW = 'ep_active_view';
const STORAGE_KEY_SCROLL = 'ep_scroll_pos';

const App: React.FC = () => {
  // --- State ---
  const [activeView, setActiveView] = useState<MediaType>(() => 
    (localStorage.getItem(STORAGE_KEY_VIEW) as MediaType) || 'movie'
  );
  const [sortOrder, setSortOrder] = useState<SortOption>('year');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CollectionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // --- Data (Live Query) ---
  const collection = useLiveQuery(async () => {
    let query = db.items.where('type').equals(activeView);
    const items = await query.toArray();
    
    if (sortOrder === 'title') return items.sort((a, b) => a.title.localeCompare(b.title));
    if (sortOrder === 'year') return items.sort((a, b) => String(b.year).localeCompare(String(a.year)));
    return items.sort((a, b) => new Date(b.imported_at).getTime() - new Date(a.imported_at).getTime());
  }, [activeView, sortOrder]);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIEW, activeView);
    const savedScroll = localStorage.getItem(STORAGE_KEY_SCROLL);
    if (savedScroll) window.scrollTo(0, parseInt(savedScroll));

    const handleScroll = () => localStorage.setItem(STORAGE_KEY_SCROLL, window.scrollY.toString());
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeView]);

  // --- Handlers ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await searchAPI(searchQuery, activeView);
      if (results.length === 0) setSearchError("No results found.");
      else setSearchResults(results);
    } catch (err: any) {
      setSearchError(err.message || "Unable to retrieve data.");
    } finally {
      setIsSearching(false);
    }
  };

  const addToCollection = async (item: CollectionItem) => {
    if (await checkDuplicate(item.id, item.title)) {
      alert("Item already exists.");
      return;
    }
    await db.items.add(item);
    setSearchResults(prev => prev.filter(p => p.id !== item.id)); 
  };

  const removeFromCollection = async (item: CollectionItem) => {
    if (confirm("Remove this item?")) {
      await db.items.delete(item.id);
    }
  };

  const exportData = async () => { /* ... existing export logic ... */ };
  const importData = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... existing import logic ... */ };

  // --- Render ---
  return (
    <div className="container-fluid bg-light min-vh-100 pb-5">
      <AppControls 
        activeView={activeView}
        onViewChange={(view) => { setActiveView(view); setSearchResults([]); setSearchQuery(''); }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        isSearching={isSearching}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        onExport={exportData}
        onImport={importData}
      />

      <div className="container">
        {searchError && (
             <div className="alert alert-danger d-flex justify-content-between align-items-center">
                 {searchError}
                 <button className="btn btn-sm btn-outline-danger" onClick={handleSearch}>Retry</button>
             </div>
        )}

        {/* Search Results Section */}
        {searchResults.length > 0 && (
            <div className="mb-5">
                <h5>Search Results</h5>
                <div className="row">
                    {searchResults.map(item => (
                      <MediaCard 
                        key={item.id} 
                        item={item} 
                        variant="search-result" 
                        onAction={addToCollection} 
                      />
                    ))}
                </div>
                <hr />
            </div>
        )}

        {/* Library Section */}
        <h5 className="text-muted mb-3">My Library ({collection?.length || 0})</h5>
        <div className="row">
            {collection?.map(item => (
              <MediaCard 
                key={item.id} 
                item={item} 
                variant="library-item" 
                onAction={removeFromCollection} 
              />
            ))}
            {collection?.length === 0 && <p className="text-muted text-center py-5">No items yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default App;