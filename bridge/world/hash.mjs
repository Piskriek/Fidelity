// Counter-based integer hashing and the SHA-256 chain. No draw depends on how many draws came before it, so
// nothing a character does can shift the world's later random numbers. Integer-only: no Math.random, no clocks.
import crypto from 'node:crypto';

export const fmix32 = h => {
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
};

// hash32(a, b, c, ...) -> uint32, each argument an integer
export function hash32(...xs) {
  let h = 0x811c9dc5;
  for (const x of xs) h = fmix32((Math.imul(h, 0x01000193) ^ fmix32((x | 0) >>> 0)) >>> 0);
  return h;
}

// draw purposes, so different uses of the same counters never collide
export const PURPOSE = Object.freeze({ ITEM: 1, LEN: 2, SHARE: 3, EFF: 4 });

export const sha256hex = (...parts) => {
  const h = crypto.createHash('sha256');
  for (const p of parts) h.update(p);
  return h.digest('hex');
};

// h_t = SHA-256(h_{t-1} || bytes)
export const chainNext = (prevHex, bytes) => sha256hex(Buffer.from(prevHex, 'hex'), bytes);
export const GENESIS = '0'.repeat(64);
