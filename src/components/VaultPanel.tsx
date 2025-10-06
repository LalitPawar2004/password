"use client";

import React, { useEffect, useState } from 'react';
import VaultItemCard from '@/components/VaultItemCard';
import { decryptWithPassword, encryptWithPassword } from '../utils/crypto';
import { useClipboardAutoClear } from '../hooks/useClipboardAutoClear';
import './VaultPanel.css';

interface EncryptedVaultItem {
  _id: string;
  title: string;
  username: string;
  ciphertext: string;
  iv: string;
  salt: string;
  url?: string;
  notes?: string;
}

interface DecryptedVaultItem {
  _id: string;
  title: string;
  username: string;
  password?: string;
  url?: string;
  notes?: string;
}

function renderDecodedToken(token: string | null): string {
  if (!token) return '[no token]';
  try {
    const parts = token.split('.');
    if (parts.length < 2) return '[invalid token]';
    const payload = parts[1];
    // base64url -> base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const obj = JSON.parse(json);
    return JSON.stringify(obj);
  } catch (e) {
    return '[unable to decode]';
  }
}

const VaultPanel: React.FC<{ masterPassword?: string }> = ({ masterPassword }) => {
  const [vaultItems, setVaultItems] = useState<DecryptedVaultItem[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionMasterPassword, setSessionMasterPassword] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<DecryptedVaultItem | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rawEncryptedCount, setRawEncryptedCount] = useState<number | null>(null);
  const { copied, copy } = useClipboardAutoClear(15000);

  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    async function fetchAndDecrypt(password: string) {
      setLoading(true);
      setFetchError(null);
      setRawEncryptedCount(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/vault', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // try to read response body for helpful message
          let bodyText = '';
          try {
            const json = await res.json();
            bodyText = JSON.stringify(json);
          } catch (e) {
            try {
              bodyText = await res.text();
            } catch (_) {
              bodyText = '<no body>';
            }
          }
          const errMsg = `Vault fetch failed: ${res.status} ${res.statusText} ${bodyText}`;
          console.error(errMsg);
          setFetchError(errMsg);
          alert(errMsg);
          setLoading(false);
          return;
        }

        const encryptedItems: EncryptedVaultItem[] = await res.json();
        setRawEncryptedCount(encryptedItems.length);

        const decryptedItems: DecryptedVaultItem[] = [];
        for (const item of encryptedItems) {
          try {
            const decrypted = await decryptWithPassword(password, item.ciphertext, item.iv, item.salt);

            // decrypted is expected to be JSON string of fields, parse it
            const parsed = JSON.parse(decrypted);

            decryptedItems.push({
              _id: item._id,
              title: parsed.title,
              username: parsed.username,
              password: parsed.password,
              url: parsed.url,
              notes: parsed.notes,
            });
          } catch (e) {
            console.error(`Failed to decrypt item ${item._id}`, e);
          }
        }

        setVaultItems(decryptedItems);
      } catch (error) {
        console.error(error);
        const errMsg = (error instanceof Error) ? error.message : String(error);
        setFetchError(errMsg);
        alert('Failed to load or decrypt vault items: ' + errMsg);
      } finally {
        setLoading(false);
      }
    }

    const effectivePassword = masterPassword || sessionMasterPassword;
    if (!effectivePassword) {
      // don't attempt fetch until we have a password
      return;
    }

    fetchAndDecrypt(effectivePassword);
  }, [masterPassword, sessionMasterPassword]);

  if (loading) {
    return (
      <div className="vault-panel">
        <h2 className="panel-title">Your Vault</h2>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading vault items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-panel">
      <h2 className="panel-title">Your Vault</h2>
      
      <div className="search-container">
        <input 
          placeholder="Search vault items..." 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Unlock form when no password available */}
      {!(masterPassword || sessionMasterPassword) && (
        <div className="unlock-section">
          <h3 className="unlock-title">Vault Locked</h3>
          <p className="unlock-description">Enter your master password to decrypt and view your vault items:</p>
          <input
            type="password"
            placeholder="Enter master password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="password-input"
          />
          <button 
            onClick={() => { if (passwordInput) setSessionMasterPassword(passwordInput); }}
            className="unlock-button"
            disabled={!passwordInput}
          >
            Unlock Vault
          </button>
        </div>
      )}

      {/* Debug panel */}
      <details className="debug-panel">
        <summary className="debug-summary">Debug Information</summary>
        <div className="debug-content">
          <div className="debug-item">
            <strong>Stored token:</strong> {typeof window !== 'undefined' ? (localStorage.getItem('token') ? '[present]' : '[missing]') : '[ssr]'}
          </div>
          <div className="debug-item">
            <strong>Decoded token payload:</strong> {renderDecodedToken(localStorage.getItem('token'))}
          </div>
          <div className="debug-item">
            <strong>Last fetch error:</strong> {fetchError || 'none'}
          </div>
          <div className="debug-item">
            <strong>Raw encrypted items fetched:</strong> {rawEncryptedCount !== null ? rawEncryptedCount : 'n/a'}
          </div>
        </div>
      </details>

      {/* Edit Modal */}
      {editingItem && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3 className="edit-title">Edit Vault Item</h3>
            <div className="edit-form">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input 
                  value={editingItem.title} 
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  value={editingItem.username} 
                  onChange={(e) => setEditingItem({ ...editingItem, username: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  value={editingItem.password || ''} 
                  onChange={(e) => setEditingItem({ ...editingItem, password: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">URL</label>
                <input 
                  value={editingItem.url || ''} 
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea 
                  value={editingItem.notes || ''} 
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  className="form-textarea"
                  rows={3}
                />
              </div>
              <div className="edit-actions">
                <button 
                  onClick={async () => {
                    if (!editingItem) return;
                    const effectivePassword = masterPassword || sessionMasterPassword;
                    if (!effectivePassword) return alert('Master password required to re-encrypt');
                    const plaintext = JSON.stringify({ 
                      title: editingItem.title, 
                      username: editingItem.username, 
                      password: editingItem.password, 
                      url: editingItem.url, 
                      notes: editingItem.notes 
                    });
                    const { ciphertext, iv, salt } = await encryptWithPassword(effectivePassword, plaintext);
                    const res = await fetch(`/api/vault/${editingItem._id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                      body: JSON.stringify({ 
                        title: editingItem.title, 
                        username: editingItem.username, 
                        ciphertext, 
                        iv, 
                        salt, 
                        url: editingItem.url, 
                        notes: editingItem.notes 
                      }),
                    });
                    if (res.ok) {
                      setVaultItems(prev => prev.map(p => p._id === editingItem._id ? editingItem : p));
                      setEditingItem(null);
                    } else {
                      alert('Failed to update');
                    }
                  }} 
                  className="save-button"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setEditingItem(null)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vault Items List */}
      <div className="vault-content">
        {vaultItems.length === 0 ? (
          <div className="empty-state">
            <h3>No Vault Items Found</h3>
            <p>Your vault is empty. Generate and save passwords to see them here.</p>
          </div>
        ) : (
          <div className="vault-items-grid">
            {vaultItems
              .filter(i => i.title.toLowerCase().includes(filter.toLowerCase()) || i.username.toLowerCase().includes(filter.toLowerCase()))
              .map(item => (
                <VaultItemCard
                  key={item._id}
                  id={item._id}
                  title={item.title}
                  username={item.username}
                  url={item.url}
                  notes={item.notes}
                  onEdit={(id: string | undefined) => {
                    const toEdit = vaultItems.find(v => v._id === id);
                    if (toEdit) setEditingItem(toEdit);
                  }}
                  onDelete={async (id: string | undefined) => {
                    if (!id) return;
                    if (!confirm('Are you sure you want to delete this vault item? This action cannot be undone.')) return;
                    const res = await fetch(`/api/vault/${id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    });
                    if (res.ok) {
                      setVaultItems(prev => prev.filter(p => p._id !== id));
                    } else {
                      alert('Failed to delete item');
                    }
                  }}
                  onCopy={() => {
                    if (item.password) copy(item.password);
                  }}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VaultPanel;