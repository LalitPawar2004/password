// src/utils/crypto.ts

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const webcrypto = (globalThis as any).crypto;
if (!webcrypto || !webcrypto.subtle) {
  throw new Error('WebCrypto API (crypto.subtle) is not available in this environment');
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return webcrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(plaintext: string, key: CryptoKey): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(plaintext);

  const encrypted = await webcrypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoded
  );

  return { ciphertext: new Uint8Array(encrypted), iv };
}

export async function decryptData(ciphertext: Uint8Array, iv: Uint8Array, key: CryptoKey): Promise<string> {
  const decrypted = await webcrypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    ciphertext
  );

  return decoder.decode(decrypted);
}

// Helper to generate random salt
export function generateSalt(): Uint8Array {
  return webcrypto.getRandomValues(new Uint8Array(16));
}

// Helper to convert Uint8Array to base64 string
export function toBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    return btoa(String.fromCharCode(...bytes));
  }
  // Node.js fallback
  return Buffer.from(bytes).toString('base64');
}

// Helper to convert base64 string to Uint8Array
export function fromBase64(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    return new Uint8Array(
      atob(base64)
        .split('')
        .map((c) => c.charCodeAt(0))
    );
  }
  // Node.js fallback
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

// Convenience: encrypt a string with a password and return base64-encoded fields
export async function encryptWithPassword(password: string, plaintext: string) {
  const salt = generateSalt();
  const key = await deriveKey(password, salt);
  const { ciphertext, iv } = await encryptData(plaintext, key);

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    salt: toBase64(salt),
  };
}

// Convenience: decrypt base64-encoded ciphertext/iv/salt with a password and return plaintext
export async function decryptWithPassword(password: string, ciphertextB64: string, ivB64: string, saltB64: string) {
  const salt = fromBase64(saltB64);
  const iv = fromBase64(ivB64);
  const ciphertext = fromBase64(ciphertextB64);

  const key = await deriveKey(password, salt);
  const plaintext = await decryptData(ciphertext, iv, key);
  return plaintext;
}

// Backwards-compatible helpers used by components during refactor
export async function encryptVaultItem(
  item: { title: string; username: string; password: string; url?: string; notes?: string },
  masterPassword: string
) {
  if (!masterPassword) throw new Error('Master password required for encryptVaultItem');
  return encryptWithPassword(masterPassword, JSON.stringify(item));
}

export async function decryptVaultItem(
  encrypted: { ciphertext: string; iv: string; salt: string },
  masterPassword: string
) {
  if (!masterPassword) throw new Error('Master password required for decryptVaultItem');
  const plaintext = await decryptWithPassword(masterPassword, encrypted.ciphertext, encrypted.iv, encrypted.salt);
  return JSON.parse(plaintext);
}
