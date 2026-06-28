import { rngFromSeed } from '@/rng/mulberry32'

// Pronounceable syllable banks for star-catalogue-flavoured planet names.
const PREFIX = [
  'Xan', 'Vor', 'Kep', 'Cer', 'Nyx', 'Aur', 'Tha', 'Zel', 'Oph', 'Bre', 'Cas',
  'Dra', 'Ely', 'Fen', 'Gal', 'Hel', 'Ith', 'Jor', 'Kry', 'Lyr', 'Mar', 'Nim',
  'Oss', 'Pyr', 'Rho', 'Syr', 'Tor', 'Umb', 'Vel', 'Wol', 'Xer', 'Zeph',
]
const MIDDLE = ['', '', 'a', 'e', 'i', 'o', 'ae', 'ia', 'yr', 'an', 'el', ' os']
const SUFFIX = [
  'os', 'us', 'ia', 'on', 'ar', 'eth', 'ix', 'or', 'ys', 'um', 'ae', 'is', 'ea',
  'ix', 'une', 'ara', 'ion',
]
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

/**
 * A deterministic, pronounceable planet name from the seed (same seed -> same
 * name). The `::name` salt keeps it independent of the terrain RNG stream.
 */
export function planetName(seed: string): string {
  const rng = rngFromSeed(`${seed}::name`)
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]
  const core = pick(PREFIX) + pick(MIDDLE).trim() + pick(SUFFIX)
  const word = core.charAt(0).toUpperCase() + core.slice(1).toLowerCase()
  // Sometimes append a catalogue designation.
  const r = rng()
  if (r < 0.45) return `${word} ${pick(ROMAN)}`
  if (r < 0.6) return `${word}-${String.fromCharCode(97 + Math.floor(rng() * 6))}`
  return word
}

/** A filename-safe slug of the planet name (for export downloads). */
export function planetSlug(seed: string): string {
  return planetName(seed).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'planet'
}
