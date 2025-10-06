import React from 'react';
import './vaultItemCard.css';

interface VaultItemCardProps {
  id?: string;
  title: string;
  username: string;
  url?: string;
  notes?: string;
  onEdit?: (id?: string) => void;
  onDelete?: (id?: string) => void;
  onCopy?: () => void;
}

const VaultItemCard: React.FC<VaultItemCardProps> = ({ id, title, username, url, notes, onEdit, onDelete, onCopy }) => {
  return (
    <div className="vault-item-card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <div className="card-actions">
          <button onClick={() => onEdit && onEdit(id)} className="action-button edit-button">
            <svg className="icon" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Edit
          </button>
          <button onClick={() => onCopy && onCopy()} className="action-button copy-button">
            <svg className="icon" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            Copy
          </button>
          <button onClick={() => onDelete && onDelete(id)} className="action-button delete-button">
            <svg className="icon" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
      
      <div className="card-content">
        <div className="field">
          <span className="field-label">Username:</span>
          <span className="field-value">{username}</span>
        </div>
        
        {url && (
          <div className="field">
            <span className="field-label">URL:</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="url-link">
              {url}
            </a>
          </div>
        )}
        
        {notes && (
          <div className="field">
            <span className="field-label">Notes:</span>
            <span className="field-value notes-text">{notes}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaultItemCard;