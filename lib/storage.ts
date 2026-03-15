/**
 * Encrypted localStorage helpers using the Web Crypto API (AES-256-GCM).
 *
 * Strategy: a random 256-bit key is generated once per browser and stored in
 * localStorage under a separate key. All other values are encrypted with that
 * key. This protects stored credentials from casual inspection of localStorage
 * (e.g. via DevTools or browser extensions) while keeping the UX seamless —
 * no user password required.
 *
 * Note: this is "encryption at rest in the browser". It does NOT protect
 * against an attacker who has full access to the running browser process,
 * because the key lives in the same storage. The goal is defence-in-depth
 * against passive inspection, not against a fully compromised machine.
 */

const CRYPTO_KEY_STORAGE = "__dut_ck__";

// ── Key management ────────────────────────────────────────────────────────────

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(CRYPTO_KEY_STORAGE);

  if (stored) {
    try {
      const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
      return await crypto.subtle.importKey(
        "raw",
        raw,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
    } catch {
      // Key is corrupt — fall through to generate a new one
    }
  }

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const exported = await crypto.subtle.exportKey("raw", key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  localStorage.setItem(CRYPTO_KEY_STORAGE, b64);

  return key;
}

// ── Encrypt / Decrypt ─────────────────────────────────────────────────────────

async function encrypt(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  // Pack as base64: <12-byte IV><ciphertext>
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return btoa(String.fromCharCode(...combined));
}

async function decrypt(b64: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Encrypt `value` and write it to localStorage under `key`.
 */
export async function setEncrypted(key: string, value: string): Promise<void> {
  const ciphertext = await encrypt(value);
  localStorage.setItem(key, ciphertext);
}

/**
 * Read and decrypt the value stored under `key`.
 * Returns `null` if the key is missing or decryption fails.
 */
export async function getEncrypted(key: string): Promise<string | null> {
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  try {
    return await decrypt(stored);
  } catch {
    // Value is corrupt or was written before encryption was introduced
    return null;
  }
}

/**
 * Remove an encrypted entry from localStorage.
 */
export function removeEncrypted(key: string): void {
  localStorage.removeItem(key);
}
