import { useState, useEffect, useRef } from 'react';

export function useClipboardAutoClear(timeoutMs: number = 15000) {
  const [copied, setCopied] = useState<string | null>(null);
  const timerRef = useRef<any | null>(null);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        try {
          // Clear clipboard by writing empty string after timeout
          await navigator.clipboard.writeText('');
          setCopied(null);
        } catch {
          // ignore errors on clearing clipboard
        }
      }, timeoutMs);
    } catch {
      setCopied(null);
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
