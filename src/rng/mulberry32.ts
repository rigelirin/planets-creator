/**
 * Deterministic PRNG utilities. mulberry32 is a tiny, fast, well-distributed
 * 32-bit generator; xmur3 hashes a string seed into a uint32 so users can type
 * memorable seeds like "GAIA". The ONLY source of shape randomness in the app —
 * Math.random is reserved for minting brand-new seeds (see planet/seed.ts).
 */

/** Hash a string into a uint32 seed generator. */
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

/** mulberry32: uint32 seed -> deterministic () => float in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Build a deterministic float generator from a string or numeric seed. */
export function rngFromSeed(seed: string | number): () => number {
  const s = typeof seed === 'number' ? seed >>> 0 : xmur3(String(seed))()
  return mulberry32(s)
}
