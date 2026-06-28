import {
  DEFAULT_PARAMS,
  usePlanetStore,
  type ArchetypeId,
  type PlanetParams,
  type SurfaceModel,
} from '@/state/usePlanetStore'

/**
 * The six v1 planet archetypes. Each is a curated set of parameter overrides on
 * top of DEFAULT_PARAMS plus a signature seed, so selecting one yields a
 * complete, reproducible, good-looking planet. Randomize then varies only the
 * seed (shape) while keeping the archetype's palette/climate.
 *
 * This is the data spine the picker, randomizer and serializer all read from.
 */
export type Archetype = {
  id: ArchetypeId
  label: string
  blurb: string
  surfaceModel: SurfaceModel
  params: Partial<PlanetParams>
}

const CONTINENTAL: Archetype = {
  id: 'continental',
  label: 'Continental',
  blurb: 'Blue oceans, green continents, polar caps — an Earth-like world.',
  surfaceModel: 'terrestrial',
  params: {
    seed: 'genesis',
    baseFrequency: 1.25, amplitude: 0.08, octaves: 6, lacunarity: 2.0, gain: 0.5,
    warp: 0.35, ridgeMix: 0.45, continents: 0.65, islands: 0.3, craterMix: 0.0, seaLevel: 0.05,
    lowColor: '#16335e', shoreColor: '#2f6f8f', midColor: '#3f7d3a', highColor: '#cbb89a',
    iceLatitude: 0.82, iceColor: '#eef2f5', cityLights: true,
    emissiveStrength: 0.0,
    oceanEnabled: true, deepColor: '#0a2547', shallowColor: '#2e7fae', waterOpacity: 0.82,
    cloudsEnabled: true, cloudColor: '#f4f8ff', cloudCoverage: 0.42, cloudOpacity: 0.9, cloudSpeed: 0.015,
    atmosphereEnabled: true, atmosphereColor: '#5b8cff', atmosphereDensity: 1.1, atmospherePower: 3.2,
  },
}

const OCEAN: Archetype = {
  id: 'ocean',
  label: 'Ocean',
  blurb: 'A water world — endless sea broken by scattered archipelagos.',
  surfaceModel: 'terrestrial',
  params: {
    seed: 'tethys',
    baseFrequency: 1.6, amplitude: 0.07, octaves: 6, lacunarity: 2.1, gain: 0.52,
    warp: 0.4, ridgeMix: 0.32, continents: 0.5, islands: 0.75, craterMix: 0.0, seaLevel: 0.28,
    lowColor: '#08305a', shoreColor: '#2c93b5', midColor: '#3c8a4a', highColor: '#d8c79a',
    iceLatitude: 0.9, iceColor: '#eaf3f7',
    emissiveStrength: 0.0,
    oceanEnabled: true, deepColor: '#062041', shallowColor: '#1f93b6', waterOpacity: 0.9,
    cloudsEnabled: true, cloudColor: '#f6fbff', cloudCoverage: 0.55, cloudOpacity: 0.92, cloudSpeed: 0.018,
    atmosphereEnabled: true, atmosphereColor: '#4f9bff', atmosphereDensity: 1.2, atmospherePower: 3.0,
  },
}

const DESERT: Archetype = {
  id: 'desert',
  label: 'Desert',
  blurb: 'Arid dunes and wind-carved canyons under a dusty sky. No oceans.',
  surfaceModel: 'terrestrial',
  params: {
    seed: 'dune',
    baseFrequency: 1.35, amplitude: 0.075, octaves: 6, lacunarity: 2.2, gain: 0.5,
    warp: 0.55, ridgeMix: 0.55, continents: 0.7, islands: 0.1, craterMix: 0.0, seaLevel: -0.28,
    lowColor: '#7a4a25', shoreColor: '#a06a35', midColor: '#c89456', highColor: '#ecd9a6',
    iceLatitude: 0.96, iceColor: '#e7d9c4',
    emissiveStrength: 0.0,
    oceanEnabled: false, deepColor: '#3a2a18', shallowColor: '#6a4a28', waterOpacity: 0.5,
    cloudsEnabled: true, cloudColor: '#efe2c8', cloudCoverage: 0.16, cloudOpacity: 0.55, cloudSpeed: 0.02,
    atmosphereEnabled: true, atmosphereColor: '#d8a76b', atmosphereDensity: 0.85, atmospherePower: 3.4,
  },
}

const ARCTIC: Archetype = {
  id: 'arctic',
  label: 'Arctic',
  blurb: 'A frozen world — ice sheets to the tropics, slush seas, white storms.',
  surfaceModel: 'terrestrial',
  params: {
    seed: 'boreas',
    baseFrequency: 1.3, amplitude: 0.055, octaves: 6, lacunarity: 2.0, gain: 0.5,
    warp: 0.3, ridgeMix: 0.4, continents: 0.6, islands: 0.35, craterMix: 0.0, seaLevel: 0.0,
    lowColor: '#2f547a', shoreColor: '#6f9ab5', midColor: '#c4d4e2', highColor: '#ffffff',
    iceLatitude: 0.26, iceColor: '#eaf2fb',
    emissiveStrength: 0.0,
    oceanEnabled: true, deepColor: '#1d3a57', shallowColor: '#4a82a8', waterOpacity: 0.72,
    cloudsEnabled: true, cloudColor: '#ffffff', cloudCoverage: 0.5, cloudOpacity: 0.85, cloudSpeed: 0.012,
    atmosphereEnabled: true, atmosphereColor: '#9fc4ff', atmosphereDensity: 1.0, atmospherePower: 3.4,
  },
}

const VOLCANIC: Archetype = {
  id: 'volcanic',
  label: 'Volcanic',
  blurb: 'Molten basins glow through fissured basalt beneath ash clouds.',
  surfaceModel: 'terrestrial',
  params: {
    seed: 'magmar',
    baseFrequency: 1.45, amplitude: 0.1, octaves: 6, lacunarity: 2.2, gain: 0.52,
    warp: 0.45, ridgeMix: 0.62, continents: 0.55, islands: 0.4, craterMix: 0.0, seaLevel: -0.05,
    lowColor: '#1a0b08', shoreColor: '#2e1510', midColor: '#43332e', highColor: '#6a584f',
    iceLatitude: 1.1, iceColor: '#d8d2cc',
    lavaLevel: 0.06, lavaColor: '#2a0d08', emberColor: '#ff5a1e', emissiveStrength: 1.7,
    oceanEnabled: false, deepColor: '#200a06', shallowColor: '#3a1810', waterOpacity: 0.4,
    cloudsEnabled: true, cloudColor: '#6b5a52', cloudCoverage: 0.34, cloudOpacity: 0.6, cloudSpeed: 0.022,
    atmosphereEnabled: true, atmosphereColor: '#ff6a2a', atmosphereDensity: 0.95, atmospherePower: 3.0,
  },
}

const BARREN: Archetype = {
  id: 'barren',
  label: 'Barren',
  blurb: 'An airless, cratered grey moon. No water, no clouds, no sky.',
  surfaceModel: 'terrestrial',
  params: {
    seed: 'cinder',
    baseFrequency: 1.4, amplitude: 0.05, octaves: 5, lacunarity: 2.0, gain: 0.5,
    warp: 0.2, ridgeMix: 0.2, craterMix: 0.85, craterDensity: 12.0, seaLevel: -0.5,
    lowColor: '#3a3936', shoreColor: '#54524c', midColor: '#6e6a62', highColor: '#9b958b',
    iceLatitude: 1.1, iceColor: '#d8d8d8',
    emissiveStrength: 0.0,
    oceanEnabled: false, cloudsEnabled: false, atmosphereEnabled: false,
  },
}

const GAS_GIANT: Archetype = {
  id: 'gasgiant',
  label: 'Gas Giant',
  blurb: 'A banded giant of swirling clouds and a great storm. No solid surface.',
  surfaceModel: 'gaseous',
  params: {
    seed: 'jove',
    baseFrequency: 2.0, amplitude: 0.0, octaves: 6, lacunarity: 2.1, gain: 0.55,
    warp: 0.9, ridgeMix: 0.0, craterMix: 0.0, seaLevel: 0.0,
    lowColor: '#5a3a24', shoreColor: '#d8c098', midColor: '#9c5a30', highColor: '#f2e6c4',
    iceLatitude: 1.2, iceColor: '#f2e6c4', cityLights: false,
    emissiveStrength: 0.0,
    oceanEnabled: false, cloudsEnabled: false,
    atmosphereEnabled: true, atmosphereColor: '#e8c89a', atmosphereDensity: 1.5, atmospherePower: 3.0,
  },
}

/** Archetypes in display order. */
export const ARCHETYPE_LIST: Archetype[] = [
  CONTINENTAL, OCEAN, DESERT, ARCTIC, VOLCANIC, BARREN, GAS_GIANT,
]

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  continental: CONTINENTAL,
  ocean: OCEAN,
  desert: DESERT,
  arctic: ARCTIC,
  volcanic: VOLCANIC,
  barren: BARREN,
  gasgiant: GAS_GIANT,
}

/**
 * Apply an archetype: replace the whole param set with DEFAULT_PARAMS + the
 * archetype overrides (so unspecified fields reset cleanly), tag the identity,
 * and preserve only the user's viewing preference. Returns the new params so the
 * control panel can mirror them back into leva.
 */
export function applyArchetype(id: ArchetypeId): PlanetParams {
  const a = ARCHETYPES[id]
  const prev = usePlanetStore.getState().params
  const next: PlanetParams = {
    ...DEFAULT_PARAMS,
    ...a.params,
    archetype: id,
    surfaceModel: a.surfaceModel,
    autoRotate: prev.autoRotate,
  }
  usePlanetStore.getState().setParams(next)
  return next
}
