/**
 * PBKDF2 via Web Crypto — Workers + Node.
 * v2 format: v2:iterations:salt:hash (310k iters, 32-byte salt)
 * legacy: salt:hash (100k iters) still verifies, then callers can rehash.
 */
const LEGACY_ITERATIONS = 100_000;
const ITERATIONS = 310_000;
const KEY_BITS = 256;
const SALT_BYTES = 32;

function toHex(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const saltBuf = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBuf, iterations, hash: "SHA-256" }, key, KEY_BITS);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const bits = await derive(password, salt, ITERATIONS);
  return `v2:${ITERATIONS}:${toHex(salt)}:${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split(":");
  let iterations = LEGACY_ITERATIONS;
  let saltHex = "";
  let hashHex = "";

  if (parts[0] === "v2" && parts.length === 4) {
    iterations = Number(parts[1]) || ITERATIONS;
    saltHex = parts[2];
    hashHex = parts[3];
  } else if (parts.length === 2) {
    saltHex = parts[0];
    hashHex = parts[1];
  } else {
    return false;
  }

  const bits = await derive(password, fromHex(saltHex), iterations);
  const computed = toHex(bits);
  if (computed.length !== hashHex.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ hashHex.charCodeAt(i);
  }
  return mismatch === 0;
}

export function passwordNeedsRehash(stored: string) {
  return !stored.startsWith("v2:");
}
