(async () => {
  const base = 'http://localhost:3000';
  const email = 'e2e_test_user@example.com';
  const password = 'TestPass123!';

  function toBase64(bytes) {
    return Buffer.from(bytes).toString('base64');
  }
  function fromBase64(b64) {
    return Uint8Array.from(Buffer.from(b64, 'base64'));
  }

  async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptWithPassword(password, plaintext) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const enc = new TextEncoder();
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
    return { ciphertext: toBase64(new Uint8Array(ct)), iv: toBase64(iv), salt: toBase64(salt) };
  }

  async function decryptWithPassword(password, ciphertextB64, ivB64, saltB64) {
    const salt = fromBase64(saltB64);
    const iv = fromBase64(ivB64);
    const ciphertext = fromBase64(ciphertextB64);
    const key = await deriveKey(password, salt);
    const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(dec);
  }

  try {
    console.log('Registering user...');
    let res = await fetch(base + '/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    console.log('Register status:', res.status);
    if (res.status === 409) console.log('User may already exist, continuing');
    else if (!res.ok) { console.log('Register failed', await res.text()); }

    console.log('Logging in...');
    res = await fetch(base + '/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginText = await res.text();
    console.log('Login response:', res.status, loginText);
    if (!res.ok) throw new Error('Login failed');
    const { token } = JSON.parse(loginText);
    if (!token) throw new Error('No token returned');

    console.log('Encrypting and saving a vault item...');
    const plaintext = JSON.stringify({ title: 'E2E Item', username: 'e2e_user', password: 'SuperSecret1!', url: 'https://example.com', notes: 'e2e notes' });
    const enc = await encryptWithPassword(password, plaintext);
    res = await fetch(base + '/api/vault', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'E2E Item', username: 'e2e_user', ciphertext: enc.ciphertext, iv: enc.iv, salt: enc.salt, url: 'https://example.com', notes: 'e2e notes' })
    });
    console.log('Save vault status:', res.status, await res.text());
    if (!res.ok) throw new Error('Save failed');

    console.log('Fetching vault items...');
    res = await fetch(base + '/api/vault', { headers: { Authorization: `Bearer ${token}` } });
    const items = await res.json();
    console.log('Vault items count:', items.length);
    const item = items[items.length - 1];
    console.log('Latest item id:', item._id);

    console.log('Decrypting fetched item...');
    const decrypted = await decryptWithPassword(password, item.ciphertext, item.iv, item.salt);
    console.log('Decrypted JSON:', decrypted);

    console.log('Updating the item title and re-encrypting...');
    const parsed = JSON.parse(decrypted);
    parsed.title = 'E2E Item Updated';
    const newPlain = JSON.stringify(parsed);
    const newEnc = await encryptWithPassword(password, newPlain);
    res = await fetch(base + '/api/vault/' + item._id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: parsed.title, username: parsed.username, ciphertext: newEnc.ciphertext, iv: newEnc.iv, salt: newEnc.salt, url: parsed.url, notes: parsed.notes })
    });
    console.log('Update status:', res.status, await res.text());

    console.log('Deleting the item...');
    res = await fetch(base + '/api/vault/' + item._id, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    console.log('Delete status:', res.status, await res.text());

    console.log('E2E script completed successfully');
  } catch (err) {
    console.error('E2E error:', err);
    process.exitCode = 1;
  }
})();
