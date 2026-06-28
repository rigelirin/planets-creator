import { Vector3 } from 'three'
import { rngFromSeed } from '@/rng/mulberry32'

// Kept modest so that offset * octaveFrequency stays within float32 precision on
// the GPU, while still decorrelating different seeds completely.
const OFFSET_SCALE = 100

/**
 * Derive the deterministic noise-domain offset from a seed. Same seed -> same
 * offset -> identical terrain, every time and on every machine (CPU math).
 * Writes into `target` to avoid per-frame allocation.
 */
export function seedToOffset(seed: string | number, target = new Vector3()): Vector3 {
  const rng = rngFromSeed(seed)
  return target.set(
    (rng() * 2 - 1) * OFFSET_SCALE,
    (rng() * 2 - 1) * OFFSET_SCALE,
    (rng() * 2 - 1) * OFFSET_SCALE,
  )
}

/** Mint a fresh random seed string. Math.random is allowed ONLY here. */
export function randomSeed(): string {
  return Math.floor(Math.random() * 0xffffffff).toString(36)
}
