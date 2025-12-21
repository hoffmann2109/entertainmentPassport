import React, { useState, useEffect } from 'react';
import { db, checkDuplicate } from './db/db';
import { searchAPI } from './api/search';
import type { CollectionItem, MediaType, SortOption } from './types/types';
import { useLiveQuery } from 'dexie-react-hooks';
import 'bootstrap/dist/css/bootstrap.min.css';

// Persistence Keys
const STORAGE_KEY_VIEW = 'ep_active_view';
const STORAGE_KEY_SCROLL = 'ep_scroll_pos';

const App: React.FC = () => {
  // --- UI State ---
  const [activeView, setActiveView] = useState<MediaType>(() => 
    (localStorage.getItem(STORAGE_KEY_VIEW) as MediaType) || 'movie'
  );
  const [sortOrder, setSortOrder] = useState<SortOption>('year');
  
  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CollectionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // --- Collection Data (Live from DB) ---
  const collection = useLiveQuery(async () => {
    let query = db.items.where('type').equals(activeView);
    const items = await query.toArray();
    
    // In-memory sort (IndexedDB sorting is limited)
    if (sortOrder === 'title') return items.sort((a, b) => a.title.localeCompare(b.title));
    if (sortOrder === 'year') return items.sort((a, b) => String(b.year).localeCompare(String(a.year)));
    // Default: Imported At (Newest first)
    return items.sort((a, b) => new Date(b.imported_at).getTime() - new Date(a.imported_at).getTime());
  }, [activeView, sortOrder]);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIEW, activeView);
    // Restore Scroll
    const savedScroll = localStorage.getItem(STORAGE_KEY_SCROLL);
    if (savedScroll) window.scrollTo(0, parseInt(savedScroll));

    const handleScroll = () => localStorage.setItem(STORAGE_KEY_SCROLL, window.scrollY.toString());
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeView]);

  // --- Actions ---
const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await searchAPI(searchQuery, activeView);
      
      if (results.length === 0) {
         setSearchError("No results found."); 
      } else {
         setSearchResults(results);
      }
      
    } catch (err: any) {
      setSearchError(err.message || "Unable to retrieve data. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const addToCollection = async (item: CollectionItem) => {
    const isDup = await checkDuplicate(item.id, item.title);
    if (isDup) {
      alert("Item already exists in your collection.");
      return;
    }
    await db.items.add(item);
    setSearchResults(prev => prev.filter(p => p.id !== item.id)); // Remove from search results
  };

  // NEW: Remove functionality
  const removeFromCollection = async (id: string) => {
    if (confirm("Are you sure you want to remove this item?")) {
      await db.items.delete(id);
    }
  };

  const exportData = async () => {
    const allItems = await db.items.toArray();
    const blob = new Blob([JSON.stringify(allItems, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entertainment_passport_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        if (!Array.isArray(raw)) throw new Error("Invalid format");
        
        let addedCount = 0;
        for (const item of raw) {
            // Basic validation check
            if(!item.id || !item.title) continue;
            
            const isDup = await checkDuplicate(item.id, item.title);
            if (!isDup) {
                await db.items.add(item);
                addedCount++;
            }
        }
        alert(`Import complete. ${addedCount} items added.`);
      } catch (err) {
        alert("Failed to parse import file.");
      }
    };
    reader.readAsText(file);
  };

// --- Render Helpers ---
  const renderCard = (item: CollectionItem, isResult: boolean) => {
    // 1. Dynamic Aspect Ratio: 
    // Games = 16/9 (Landscape), Albums = 1/1 (Square), Movies/TV = 2/3 (Portrait)
    let aspectRatio = '2/3';
    if (item.type === 'game') aspectRatio = '16/9';
    if (item.type === 'album') aspectRatio = '1/1';

    // 2. Dynamic Grid Width:
    // Make game cards wider (col-lg-3) because landscape images need more width to look good.
    // Movies/TV stay narrow (col-lg-2) to fit more posters.
    const colClass = item.type === 'game' 
      ? "col-12 col-md-6 col-lg-4 mb-4" // Wider for Games
      : "col-6 col-md-3 col-lg-2 mb-4"; // Taller/Narrower for Movies/TV/Albums

    return (
      <div className={colClass} key={item.id}>
        <div className="card h-100 shadow-sm border-0">
          <div style={{ 
              aspectRatio: aspectRatio, // Apply the dynamic ratio here
              overflow: 'hidden', 
              background: '#000', // Black background often looks better for games/movies
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
          }}>
              <img 
                  src={item.cover_image_url} 
                  className="card-img-top" 
                  style={{ 
                      objectFit: 'cover', // 'cover' fills the box perfectly now that ratios match
                      width: '100%',
                      height: '100%'
                  }} 
                  alt={item.title} 
              />
          </div>
          <div className="card-body p-2 d-flex flex-column">
            <h6 className="card-title text-truncate mb-1" title={item.title}>{item.title}</h6>
            
            <small className="text-muted mb-2">{item.year}</small>
            
            <div className="mt-auto">
              {isResult ? (
                <button className="btn btn-sm btn-primary w-100" onClick={() => addToCollection(item)}>
                  Add +
                </button>
              ) : (
                <button className="btn btn-sm btn-outline-danger w-100" onClick={() => removeFromCollection(item.id)}>
                  Remove
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid bg-light min-vh-100 pb-5">
      {/* Navbar / Controls */}
      <div className="sticky-top bg-white border-bottom py-3 px-3 mb-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="m-0">Entertainment Passport</h4>
          <div>
            <button className="btn btn-outline-secondary btn-sm me-2" onClick={exportData}>Export JSON</button>
            <label className="btn btn-outline-secondary btn-sm">
              Import JSON <input type="file" hidden accept=".json" onChange={importData} />
            </label>
          </div>
        </div>

        {/* View Switcher */}
        <div className="btn-group w-100 mb-3">
          {(['movie', 'tv', 'game', 'album'] as MediaType[]).map(type => (
            <button 
                key={type}
                className={`btn ${activeView === type ? 'btn-dark' : 'btn-outline-dark'}`}
                onClick={() => { setActiveView(type); setSearchResults([]); setSearchQuery(''); }}
            >
              {type.toUpperCase()}S
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="row g-2">
            <div className="col-md-8">
                <form onSubmit={handleSearch} className="d-flex gap-2">
                    <input 
                        className="form-control" 
                        placeholder={`Search ${activeView}s...`} 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" disabled={isSearching}>
                        {isSearching ? '...' : 'Search'}
                    </button>
                </form>
            </div>
            <div className="col-md-4">
                <select className="form-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOption)}>
                    <option value="added">Recently Added</option>
                    <option value="title">Alphabetical</option>
                    <option value="year">Release Year</option>
                </select>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container">
        {searchError && (
             <div className="alert alert-danger d-flex justify-content-between align-items-center">
                 {searchError}
                 <button className="btn btn-sm btn-outline-danger" onClick={handleSearch}>Retry</button>
             </div>
        )}

        {/* Search Results Overlay */}
        {searchResults.length > 0 && (
            <div className="mb-5">
                <h5>Search Results</h5>
                <div className="row">
                    {searchResults.map(item => renderCard(item, true))}
                </div>
                <hr />
            </div>
        )}

        {/* Library */}
        <h5 className="text-muted mb-3">My Library ({collection?.length || 0})</h5>
        <div className="row">
            {collection?.map(item => renderCard(item, false))}
            {collection?.length === 0 && <p className="text-muted text-center py-5">No items in this collection yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default App;