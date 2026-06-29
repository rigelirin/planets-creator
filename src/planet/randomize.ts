import { Color } from 'three'
import { rngFromSeed } from '@/rng/mulberry32'
import { randomSeed } from '@/planet/seed'
import { ARCHETYPES } from '@/planet/archetypes'
import {
  DEFAULT_PARAMS,
  usePlanetStore,
  type Locks,
  type PlanetParams,
} from '@/state/usePlanetStore'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Jitter a number around `base` by ±`spread`, clamped to [lo, hi]. */
function jnum(rng: () => number, base: number, spread: number, lo: number, hi: number): number {
  return clamp(base + (rng() * 2 - 1) * spread, lo, hi)
}

/** Jitter a hex colour in HSL space so it stays within the archetype's family. */
function jcol(rng: () => number, hex: string, dH: number, dS: number, dL: number): string {
  const c = new Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  c.setHSL(
    ((hsl.h + (rng() * 2 - 1) * dH) % 1 + 1) % 1,
    clamp(hsl.s + (rng() * 2 - 1) * dS, 0, 1),
    clamp(hsl.l + (rng() * 2 - 1) * dL, 0, 1),
  )
  return `#${c.getHexString()}`
}

/**
 * Re-roll the planet within its current archetype, honouring lock groups.
 *
 * Each unlocked group is jittered around the archetype's baseline (not pure
 * random — colours move in HSL so they stay coherent, scalars stay in range).
 * `shape` also mints a new seed (new landmass); locked groups keep the live
 * values untouched. Archetype identity (which shells exist, craters on/off,
 * emissive on/off) is preserved. Returns the new params for the leva mirror.
 */
export function randomize(locks: Locks): PlanetParams {
  const cur = usePlanetStore.getState().params
  const base: PlanetParams = { ...DEFAULT_PARAMS, ...ARCHETYPES[cur.archetype].params }
  const rng = rngFromSeed(randomSeed())
  const next: PlanetParams = { ...cur }

  if (!locks.shape) {
    next.seed = randomSeed()
    next.baseFrequency = jnum(rng, base.baseFrequency, 0.45, 0.6, 3.2)
    next.amplitude = jnum(rng, base.amplitude, 0.025, 0.03, 0.18)
    next.octaves = Math.round(jnum(rng, base.octaves, 1.2, 4, 7))
    next.lacunarity = jnum(rng, base.lacunarity, 0.25, 1.7, 2.7)
    next.gain = jnum(rng, base.gain, 0.06, 0.4, 0.62)
    next.warp = jnum(rng, base.warp, 0.22, 0, 1.1)
    next.ridgeMix = jnum(rng, base.ridgeMix, 0.2, 0, 0.95)
    next.continents = jnum(rng, base.continents, 0.18, 0.2, 1.0)
    next.islands = jnum(rng, base.islands, 0.2, 0.0, 1.0)
    next.seaLevel = jnum(rng, base.seaLevel, 0.08, -0.45, 0.4)
    next.craterDensity = jnum(rng, base.craterDensity, 2.5, 6, 20)
    next.lavaLevel = jnum(rng, base.lavaLevel, 0.04, -0.4, 0.4)
  }

  if (!locks.palette) {
    next.lowColor = jcol(rng, base.lowColor, 0.03, 0.12, 0.06)
    next.shoreColor = jcol(rng, base.shoreColor, 0.03, 0.12, 0.06)
    next.midColor = jcol(rng, base.midColor, 0.04, 0.14, 0.07)
    next.highColor = jcol(rng, base.highColor, 0.04, 0.12, 0.07)
    next.iceColor = jcol(rng, base.iceColor, 0.02, 0.06, 0.04)
    next.deepColor = jcol(rng, base.deepColor, 0.03, 0.12, 0.05)
    next.shallowColor = jcol(rng, base.shallowColor, 0.03, 0.12, 0.06)
    next.lavaColor = jcol(rng, base.lavaColor, 0.02, 0.1, 0.04)
    next.emberColor = jcol(rng, base.emberColor, 0.02, 0.1, 0.05)
    next.cloudColor = jcol(rng, base.cloudColor, 0.02, 0.05, 0.04)
    next.atmosphereColor = jcol(rng, base.atmosphereColor, 0.04, 0.12, 0.06)
  }

  if (!locks.climate) {
    next.iceLatitude = jnum(rng, base.iceLatitude, 0.1, 0.3, 1.2)
    next.cloudCoverage = jnum(rng, base.cloudCoverage, 0.12, 0.05, 0.85)
    next.cloudOpacity = jnum(rng, base.cloudOpacity, 0.1, 0.3, 1)
    next.cloudSpeed = jnum(rng, base.cloudSpeed, 0.006, 0, 0.05)
    next.waterOpacity = jnum(rng, base.waterOpacity, 0.08, 0.3, 1)
    next.atmosphereDensity = jnum(rng, base.atmosphereDensity, 0.25, 0.3, 2)
    next.atmospherePower = jnum(rng, base.atmospherePower, 0.5, 1.5, 5)
    // Only re-roll the glow on worlds that have it (keeps non-volcanic inert).
    next.emissiveStrength = base.emissiveStrength > 0
      ? jnum(rng, base.emissiveStrength, 0.3, 0.8, 2.4)
      : 0
    // Ring appearance jitters; ringsEnabled stays an archetype trait (like the shells).
    next.ringTilt = jnum(rng, base.ringTilt, 8, 0, 45)
    next.ringOpacity = jnum(rng, base.ringOpacity, 0.12, 0.4, 1)
    next.ringInnerColor = jcol(rng, base.ringInnerColor, 0.03, 0.1, 0.06)
    next.ringOuterColor = jcol(rng, base.ringOuterColor, 0.03, 0.1, 0.06)
  }

  usePlanetStore.getState().setParams(next)
  return next
}
