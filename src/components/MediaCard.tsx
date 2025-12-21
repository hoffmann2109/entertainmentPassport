import React from 'react';
import type { CollectionItem } from '../types/types';

interface MediaCardProps {
  item: CollectionItem;
  variant: 'search-result' | 'library-item';
  onAction: (item: CollectionItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, variant, onAction }) => {
  // 1. Determine Aspect Ratio & Grid Class based on type
  let aspectRatio = '2/3';
  let colClass = "col-6 col-md-3 col-lg-2 mb-4"; // Default (Movie/TV)

  if (item.type === 'game') {
    aspectRatio = '16/9';
    colClass = "col-12 col-md-6 col-lg-4 mb-4";
  } else if (item.type === 'album') {
    aspectRatio = '1/1';
  }

  return (
    <div className={colClass}>
      <div className="card h-100 shadow-sm border-0">
        <div style={{ 
            aspectRatio, 
            overflow: 'hidden', 
            background: '#000', 
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
          <img 
            src={item.cover_image_url} 
            className="card-img-top" 
            style={{ objectFit: 'cover', width: '100%', height: '100%' }} 
            alt={item.title} 
          />
        </div>
        <div className="card-body p-2 d-flex flex-column">
          <h6 className="card-title text-truncate mb-1" title={item.title}>{item.title}</h6>
          <small className="text-muted mb-2">{item.year}</small>
          
          <div className="mt-auto">
            {variant === 'search-result' ? (
              <button className="btn btn-sm btn-primary w-100" onClick={() => onAction(item)}>
                Add +
              </button>
            ) : (
              <button className="btn btn-sm btn-outline-danger w-100" onClick={() => onAction(item)}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};