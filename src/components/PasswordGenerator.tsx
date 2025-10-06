// moved from src/app/components/PasswordGenerator.tsx
"use client";

import React, { useState } from 'react';
import { useClipboardAutoClear } from '../hooks/useClipboardAutoClear';
import './PasswordGenerator.css';

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+[]{}|;:,.<>?';
const LOOKALIKES = 'Il1O0';

function generatePassword(options: {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeLookalikes: boolean;
}): string {
  let chars = '';
  if (options.lowercase) chars += LOWERCASE;
  if (options.uppercase) chars += UPPERCASE;
  if (options.numbers) chars += NUMBERS;
  if (options.symbols) chars += SYMBOLS;

  if (options.excludeLookalikes) {
    chars = chars.split('').filter((ch) => !LOOKALIKES.includes(ch)).join('');
  }

  if (!chars) return '';

  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);
  return Array.from(array, (num) => chars[num % chars.length]).join('');
}

type PasswordGeneratorProps = {
  onPasswordGenerated?: (password: string) => void;
};

const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onPasswordGenerated }) => {
  const [length, setLength] = useState(16);
  const [lowercase, setLowercase] = useState(true);
  const [uppercase, setUppercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeLookalikes, setExcludeLookalikes] = useState(false);
  const [password, setPassword] = useState('');
  const { copied, copy } = useClipboardAutoClear(15000);

  const handleGenerate = () => {
    const newPassword = generatePassword({
      length,
      lowercase,
      uppercase,
      numbers,
      symbols,
      excludeLookalikes,
    });
    setPassword(newPassword);
    if (onPasswordGenerated) onPasswordGenerated(newPassword);
  };

  const handleCopy = () => {
    if (password) copy(password);
  };

  return (
    <div className="password-generator">
      <h2 className="generator-title">Password Generator</h2>

      <div className="length-control">
        <label className="length-label">
          Length: <span className="length-value">{length}</span>
        </label>
        <input
          type="range"
          min="8"
          max="32"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="length-slider"
        />
      </div>

      <div className="options-grid">
        <label className="option-item">
          <input 
            type="checkbox" 
            checked={lowercase} 
            onChange={() => setLowercase(!lowercase)} 
            className="option-checkbox"
          />
          <span className="option-text">Include lowercase</span>
        </label>
        
        <label className="option-item">
          <input 
            type="checkbox" 
            checked={uppercase} 
            onChange={() => setUppercase(!uppercase)} 
            className="option-checkbox"
          />
          <span className="option-text">Include uppercase</span>
        </label>
        
        <label className="option-item">
          <input 
            type="checkbox" 
            checked={numbers} 
            onChange={() => setNumbers(!numbers)} 
            className="option-checkbox"
          />
          <span className="option-text">Include numbers</span>
        </label>
        
        <label className="option-item">
          <input 
            type="checkbox" 
            checked={symbols} 
            onChange={() => setSymbols(!symbols)} 
            className="option-checkbox"
          />
          <span className="option-text">Include symbols</span>
        </label>
        
        <label className="option-item">
          <input 
            type="checkbox" 
            checked={excludeLookalikes} 
            onChange={() => setExcludeLookalikes(!excludeLookalikes)} 
            className="option-checkbox"
          />
          <span className="option-text">Exclude look-alikes</span>
        </label>
      </div>

      <div className="action-buttons">
        <button onClick={handleGenerate} className="generate-button">
          Generate Password
        </button>
        <button 
          onClick={handleCopy} 
          disabled={!password} 
          className={`copy-button ${copied ? 'copied' : ''}`}
        >
          {copied ? (
            <>
              <span className="check-icon">✓</span>
              Copied!
            </>
          ) : (
            'Copy'
          )}
        </button>
      </div>

      <div className="password-display">
        <label className="password-label">Generated Password:</label>
        <div className="password-output">
          {password || '[Click generate to create a password]'}
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;