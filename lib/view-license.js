const IV_LEN = 12;

/** 소스에 평문 라이선스 문자열을 두지 않음 (kabeadksy 암호문) */
const EXPECTED_CIPHER =
  "9fjjJf04SQthC69rgRHKKv7h8n+uBu5idyaQKI6c52C7a8c2UQ==";

const KEY_MATERIAL_PARTS = ["k4", "b34d", "Aut0", "v13w", "G8te", "2026"];
const PBKDF2_SALT = "kabead-auto-view-v1";

/** @type {CryptoKey | null} */
let cachedAesKey = null;

function toBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(encoded) {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getAesKey() {
  if (cachedAesKey) return cachedAesKey;

  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(KEY_MATERIAL_PARTS.join("")),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  cachedAesKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(PBKDF2_SALT),
      iterations: 100_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  return cachedAesKey;
}

export async function encryptView(plaintext) {
  const key = await getAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(String(plaintext)),
  );

  const combined = new Uint8Array(IV_LEN + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), IV_LEN);
  return toBase64(combined);
}

export async function decryptView(encoded) {
  const combined = fromBase64(encoded.trim());
  const iv = combined.slice(0, IV_LEN);
  const data = combined.slice(IV_LEN);
  const key = await getAesKey();
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );
  return new TextDecoder().decode(plain);
}

export async function isViewAllowed(viewCipher) {
  if (!viewCipher?.trim()) return false;
  try {
    const fromEnv = await decryptView(viewCipher);
    const expected = await decryptView(EXPECTED_CIPHER);
    return fromEnv.length > 0 && fromEnv === expected;
  } catch {
    return false;
  }
}
