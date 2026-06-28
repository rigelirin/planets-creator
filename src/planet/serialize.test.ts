import { describe, expect, test } from 'vitest'
import { decodeParams, encodeParams, parsePresetJson, presetJson } from '@/planet/serialize'
import { DEFAULT_PARAMS, type PlanetParams } from '@/state/usePlanetStore'

describe('serialize', () => {
  test('encode -> decode round-trips every param', () => {
    const p: PlanetParams = {
      ...DEFAULT_PARAMS,
      archetype: 'volcanic',
      seed: 'round-trip-✓',
      baseFrequency: 1.234,
      emissiveStrength: 1.7,
      oceanEnabled: false,
      lowColor: '#1a0b08',
    }
    expect(decodeParams(encodeParams(p))).toEqual(p)
  })

  test('decode returns null for garbage / empty input', () => {
    expect(decodeParams('')).toBeNull()
    expect(decodeParams('not%%base64')).toBeNull()
  })

  test('decode of a different version is rejected', () => {
    const badVersion = btoa(JSON.stringify({ v: 999, p: DEFAULT_PARAMS }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(decodeParams(badVersion)).toBeNull()
  })

  test('sanitize repairs an invalid archetype and mistyped fields', () => {
    const enc = encodeParams({
      ...DEFAULT_PARAMS,
      archetype: 'bogus' as PlanetParams['archetype'],
      baseFrequency: 'oops' as unknown as number,
    })
    const decoded = decodeParams(enc)!
    expect(decoded.archetype).toBe(DEFAULT_PARAMS.archetype)
    expect(decoded.baseFrequency).toBe(DEFAULT_PARAMS.baseFrequency)
  })

  test('JSON preset round-trips', () => {
    const p: PlanetParams = { ...DEFAULT_PARAMS, seed: 'preset-1', cloudsEnabled: false }
    expect(parsePresetJson(presetJson(p))).toEqual(p)
    expect(parsePresetJson('{ not json')).toBeNull()
  })
})
