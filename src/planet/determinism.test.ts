import { describe, expect, test } from 'vitest'
import { rngFromSeed } from '@/rng/mulberry32'
import { seedToOffset } from '@/planet/seed'
import { planetName, planetSlug } from '@/planet/nameGen'

describe('determinism', () => {
  test('rngFromSeed is reproducible for the same seed', () => {
    const a = rngFromSeed('GAIA')
    const b = rngFromSeed('GAIA')
    const seqA = [a(), a(), a(), a()]
    const seqB = [b(), b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })

  test('different seeds produce different streams', () => {
    expect(rngFromSeed('GAIA')()).not.toBe(rngFromSeed('MARS')())
  })

  test('rng output stays in [0, 1)', () => {
    const rng = rngFromSeed('range-check')
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  test('seedToOffset is deterministic and seed-sensitive', () => {
    expect(seedToOffset('genesis').toArray()).toEqual(seedToOffset('genesis').toArray())
    expect(seedToOffset('genesis').toArray()).not.toEqual(seedToOffset('tethys').toArray())
  })

  test('seedToOffset stays within OFFSET_SCALE bounds', () => {
    for (const s of ['genesis', 'magmar', 'boreas', 'a', '0', 'long-seed-string']) {
      seedToOffset(s).toArray().forEach((c) => expect(Math.abs(c)).toBeLessThanOrEqual(100))
    }
  })

  test('planetName is deterministic, seed-sensitive, and slug is filename-safe', () => {
    expect(planetName('genesis')).toBe(planetName('genesis'))
    expect(planetName('genesis')).not.toBe(planetName('tethys'))
    expect(planetName('genesis').length).toBeGreaterThan(2)
    expect(planetSlug('genesis')).toMatch(/^[a-zA-Z0-9-]+$/)
  })
})
