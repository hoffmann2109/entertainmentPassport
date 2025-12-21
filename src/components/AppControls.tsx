import React from 'react';
import type { MediaType, SortOption } from '../types/types';

interface AppControlsProps {
  activeView: MediaType;
  onViewChange: (view: MediaType) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  isSearching: boolean;
  sortOrder: SortOption;
  onSortChange: (val: SortOption) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AppControls: React.FC<AppControlsProps> = ({
  activeView, onViewChange,
  searchQuery, onSearchChange, onSearchSubmit, isSearching,
  sortOrder, onSortChange,
  onExport, onImport
}) => {
  return (
    <div className="sticky-top bg-white border-bottom py-3 px-3 mb-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Entertainment Passport</h4>
        <div>
          <button className="btn btn-outline-secondary btn-sm me-2" onClick={onExport}>Export JSON</button>
          <label className="btn btn-outline-secondary btn-sm">
            Import JSON <input type="file" hidden accept=".json" onChange={onImport} />
          </label>
        </div>
      </div>

      {/* View Switcher */}
      <div className="btn-group w-100 mb-3">
        {(['movie', 'tv', 'game', 'album'] as MediaType[]).map(type => (
          <button 
              key={type}
              className={`btn ${activeView === type ? 'btn-dark' : 'btn-outline-dark'}`}
              onClick={() => onViewChange(type)}
          >
            {type.toUpperCase()}S
          </button>
        ))}
      </div>

      {/* Search & Sort */}
      <div className="row g-2">
        <div className="col-md-8">
          <form onSubmit={onSearchSubmit} className="d-flex gap-2">
            <input 
              className="form-control" 
              placeholder={`Search ${activeView}s...`} 
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={isSearching}>
              {isSearching ? '...' : 'Search'}
            </button>
          </form>
        </div>
        <div className="col-md-4">
          <select className="form-select" value={sortOrder} onChange={(e) => onSortChange(e.target.value as SortOption)}>
            <option value="added">Recently Added</option>
            <option value="title">Alphabetical</option>
            <option value="year">Release Year</option>
          </select>
        </div>
      </div>
    </div>
  );
};