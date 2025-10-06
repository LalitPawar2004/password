// src/hooks/useClipboardAutoClear.ts
import { useState, useEffect, useRef } from 'react';

export function useClipboardAutoClear(timeoutMs: number = 15000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        try {
          // Clear clipboard by writing empty string after timeout
          await navigator.clipboard.writeText('');
          setCopied(false);
        } catch {
          // ignore errors on clearing clipboard
        }
      }, timeoutMs);
    } catch {
      setCopied(false);
      alert('Failed to copy to clipboard.');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { copied, copy };
}
