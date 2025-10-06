"use client";

import React, { useState } from 'react';
import PasswordGenerator from '@/components/PasswordGenerator';
import VaultPanel from '@/components/VaultPanel';
import { encryptWithPassword, toBase64 } from '@/utils/crypto';
import './page.css';

export default function Dashboard() {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [loginPassword, setLoginPassword] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('masterPassword') || '';
    }
    return '';
  }); // used to derive encryption key

  const handleSave = async () => {
    if (!generatedPassword || !title || !username) return setStatus('Fill title, username and generate a password');
    if (!loginPassword) return setStatus('Enter your login password to encrypt');

    setStatus('Encrypting...');
    const plaintext = JSON.stringify({ title, username, password: generatedPassword, url, notes });
    const { ciphertext, iv, salt } = await encryptWithPassword(loginPassword, plaintext);

    const token = localStorage.getItem('token');
    if (!token) return setStatus('Not authenticated');

    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, username, ciphertext, iv, salt, url, notes }),
    });

    if (res.ok) {
      setStatus('Saved');
      setTitle(''); setUsername(''); setUrl(''); setNotes(''); setGeneratedPassword('');
      // store master password in session so the vault can auto-unlock after reload
      try { sessionStorage.setItem('masterPassword', loginPassword); } catch {}
      // trigger a reload (keeps masterPassword in sessionStorage)
      window.location.reload();
    } else {
      const data = await res.json();
      setStatus(data.message || 'Save failed');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2 className="section-title">Password Generator</h2>
          
          <div className="master-password-input">
            <label className="form-label">
              Your Login Password (for encryption)
            </label>
            <input 
              type="password" 
              value={loginPassword} 
              onChange={(e) => setLoginPassword(e.target.value)} 
              className="form-input"
              placeholder="Enter your master password"
            />
          </div>

          <PasswordGenerator onPasswordGenerated={setGeneratedPassword} />
          
          <div className="vault-form">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="form-input"
                placeholder="e.g., Gmail account"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="form-input"
                placeholder="e.g., your.email@gmail.com"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">URL</label>
              <input 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                className="form-input"
                placeholder="e.g., https://gmail.com"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="form-textarea"
                placeholder="Additional notes (optional)"
                rows={3}
              />
            </div>
            
            <button onClick={handleSave} className="save-button">
              Save to Vault
            </button>
            
            {status && (
              <div className={`status-message ${status.includes('Saved') ? 'success' : 'error'}`}>
                {status}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <VaultPanel masterPassword={loginPassword} />
        </div>
      </div>
    </div>
  );
}