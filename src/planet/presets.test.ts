import { beforeEach, describe, expect, test } from 'vitest'
import { applyArchetype, ARCHETYPES, ARCHETYPE_LIST } from '@/planet/archetypes'
import { randomize } from '@/planet/randomize'
import { DEFAULT_PARAMS, usePlanetStore } from '@/state/usePlanetStore'

beforeEach(() => {
  usePlanetStore.setState({
    params: { ...DEFAULT_PARAMS },
    locks: { shape: false, palette: false, climate: false },
  })
})

describe('archetypes', () => {
  test('registry holds every archetype, keyed by id', () => {
    expect(ARCHETYPE_LIST).toHaveLength(7)
    expect(Object.keys(ARCHETYPES).sort()).toEqual(
      ['arctic', 'barren', 'continental', 'desert', 'gasgiant', 'ocean', 'volcanic'],
    )
    for (const a of ARCHETYPE_LIST) expect(ARCHETYPES[a.id]).toBe(a)
  })

  test('the gas giant is gaseous', () => {
    expect(applyArchetype('gasgiant').surfaceModel).toBe('gaseous')
  })

  test('applyArchetype writes a complete, tagged param set', () => {
    const next = applyArchetype('volcanic')
    expect(next.archetype).toBe('volcanic')
    expect(next.surfaceModel).toBe('terrestrial')
    expect(next.seed).toBe('magmar')
    expect(next.emissiveStrength).toBeGreaterThan(0)
    expect(next.oceanEnabled).toBe(false)
    // every default key is present (no undefined leaks)
    for (const key of Object.keys(DEFAULT_PARAMS)) {
      expect(next[key as keyof typeof next]).toBeDefined()
    }
    expect(usePlanetStore.getState().params).toEqual(next)
  })

  test('barren is airless; non-volcanic archetypes stay inert', () => {
    const barren = applyArchetype('barren')
    expect(barren.oceanEnabled).toBe(false)
    expect(barren.cloudsEnabled).toBe(false)
    expect(barren.atmosphereEnabled).toBe(false)
    expect(barren.craterMix).toBeGreaterThan(0)
    expect(applyArchetype('continental').emissiveStrength).toBe(0)
  })

  test('applyArchetype preserves the viewing preference (autoRotate)', () => {
    usePlanetStore.getState().setParam('autoRotate', false)
    expect(applyArchetype('ocean').autoRotate).toBe(false)
  })
})

describe('randomize + lock groups', () => {
  test('locking the palette keeps colours, frees the shape', () => {
    applyArchetype('continental')
    const before = usePlanetStore.getState().params
    const next = randomize({ shape: false, palette: true, climate: false })

    // palette locked -> identical
    expect(next.lowColor).toBe(before.lowColor)
    expect(next.midColor).toBe(before.midColor)
    expect(next.highColor).toBe(before.highColor)
    // shape free -> new seed
    expect(next.seed).not.toBe(before.seed)
  })

  test('locking the shape keeps the landmass + terrain knobs', () => {
    applyArchetype('continental')
    const before = usePlanetStore.getState().params
    const next = randomize({ shape: true, palette: false, climate: false })

    expect(next.seed).toBe(before.seed)
    expect(next.baseFrequency).toBe(before.baseFrequency)
    expect(next.ridgeMix).toBe(before.ridgeMix)
    expect(next.seaLevel).toBe(before.seaLevel)
    // palette free -> at least one colour moved
    const paletteMoved =
      next.lowColor !== before.lowColor ||
      next.midColor !== before.midColor ||
      next.highColor !== before.highColor
    expect(paletteMoved).toBe(true)
  })

  test('locking climate keeps the ice line + shell params', () => {
    applyArchetype('continental')
    const before = usePlanetStore.getState().params
    const next = randomize({ shape: false, palette: false, climate: true })

    expect(next.iceLatitude).toBe(before.iceLatitude)
    expect(next.cloudCoverage).toBe(before.cloudCoverage)
    expect(next.atmosphereDensity).toBe(before.atmosphereDensity)
  })

  test('randomize never re-enables an archetype shell that was off', () => {
    applyArchetype('barren') // airless
    const next = randomize({ shape: false, palette: false, climate: false })
    expect(next.oceanEnabled).toBe(false)
    expect(next.cloudsEnabled).toBe(false)
    expect(next.atmosphereEnabled).toBe(false)
  })
})
