// Client-side AES-256-GCM Encryption / Decryption service using native Web Crypto API

const PBKDF2_ITERATIONS = 100000;
const KEY_LEN = 256; // AES-256
const SALT_KEY = 'shield_device_salt_v2';
const SECRET_PASS_KEY = 'shield_local_key_pass';

// Helper to get or create a device-specific salt
function getDeviceSalt(): Uint8Array {
  let saltStr = localStorage.getItem(SALT_KEY);
  if (!saltStr) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    saltStr = btoa(String.fromCharCode(...salt));
    localStorage.setItem(SALT_KEY, saltStr);
  }
  const binary = atob(saltStr);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate encryption key derived from password & salt
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LEN },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt string data to Base64 JSON payload containing iv, ciphertext, salt
export async function encryptData(plainText: string): Promise<string> {
  try {
    const salt = getDeviceSalt();
    const key = await deriveKey(SECRET_PASS_KEY, salt);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes IV for GCM
    
    const enc = new TextEncoder();
    const encodedData = enc.encode(plainText);
    
    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedData
    );

    const cipherArray = new Uint8Array(cipherBuffer);
    
    // Convert to base64 strings
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const cipherBase64 = btoa(String.fromCharCode(...cipherArray));
    const saltBase64 = btoa(String.fromCharCode(...salt));

    return JSON.stringify({
      iv: ivBase64,
      ciphertext: cipherBase64,
      salt: saltBase64,
      metadata: 'AES-256-GCM-PBKDF2-100K'
    });
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed: ' + error);
  }
}

// Decrypt encrypted payload back to string
export async function decryptData(encryptedJson: string): Promise<string> {
  try {
    const payload = JSON.parse(encryptedJson);
    const iv = new Uint8Array(atob(payload.iv).split('').map(c => c.charCodeAt(0)));
    const salt = new Uint8Array(atob(payload.salt).split('').map(c => c.charCodeAt(0)));
    const cipher = new Uint8Array(atob(payload.ciphertext).split('').map(c => c.charCodeAt(0)));

    const key = await deriveKey(SECRET_PASS_KEY, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      cipher
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed: ' + error);
  }
}
