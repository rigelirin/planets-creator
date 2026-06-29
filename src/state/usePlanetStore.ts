import { create } from 'zustand'
import { randomSeed } from '@/planet/seed'

/** The six v1 planet archetypes. `surfaceModel` reserves room for gas giants. */
export type ArchetypeId =
  | 'continental'
  | 'ocean'
  | 'desert'
  | 'arctic'
  | 'volcanic'
  | 'barren'
  | 'gasgiant'

export type SurfaceModel = 'terrestrial' | 'gaseous'

/**
 * Randomize lock groups. Locking a group freezes it across a Randomize: lock
 * `shape` to keep the same landmass and relief while re-rolling colours; lock
 * `palette` to keep the look while re-rolling the terrain.
 */
export type LockGroup = 'shape' | 'palette' | 'climate'
export type Locks = Record<LockGroup, boolean>

/**
 * M3 parameter set: seed + terrain shape + elevation palette + ice climate +
 * ocean / cloud / atmosphere shells. Grows into the full registry-driven
 * PlanetDefinition (archetype + locks + ramps) in M4.
 *
 * The store is the single source of truth. UI writes here via setParam; the
 * scene components subscribe imperatively and mutate shader uniforms directly,
 * so dragging a control never re-renders React. The `*Enabled` booleans are read
 * with zustand selectors (they DO toggle React render, but only when flipped).
 */
export type PlanetParams = {
  // identity
  archetype: ArchetypeId
  surfaceModel: SurfaceModel
  // determinism
  seed: string
  // terrain shape
  baseFrequency: number
  amplitude: number
  octaves: number
  lacunarity: number
  gain: number
  warp: number
  ridgeMix: number
  continents: number
  islands: number
  craterMix: number
  craterDensity: number
  seaLevel: number
  // palette
  lowColor: string
  shoreColor: string
  midColor: string
  highColor: string
  // climate
  iceLatitude: number
  iceColor: string
  cityLights: boolean
  // volcanic / emissive
  lavaLevel: number
  lavaColor: string
  emberColor: string
  emissiveStrength: number
  // ocean shell
  oceanEnabled: boolean
  deepColor: string
  shallowColor: string
  waterOpacity: number
  // cloud shell
  cloudsEnabled: boolean
  cloudColor: string
  cloudCoverage: number
  cloudOpacity: number
  cloudSpeed: number
  // atmosphere shell
  atmosphereEnabled: boolean
  atmosphereColor: string
  atmosphereDensity: number
  atmospherePower: number
  // ring system
  ringsEnabled: boolean
  ringInnerColor: string
  ringOuterColor: string
  ringOpacity: number
  ringTilt: number
  // scene
  autoRotate: boolean
}

export type PlanetState = {
  params: PlanetParams
  locks: Locks
  setParam: <K extends keyof PlanetParams>(key: K, value: PlanetParams[K]) => void
  setParams: (patch: Partial<PlanetParams>) => void
  setLock: (group: LockGroup, value: boolean) => void
  randomizeSeed: () => string
}

export const DEFAULT_PARAMS: PlanetParams = {
  archetype: 'continental',
  surfaceModel: 'terrestrial',
  seed: 'genesis',
  baseFrequency: 1.5,
  amplitude: 0.08,
  octaves: 6,
  lacunarity: 2.0,
  gain: 0.5,
  warp: 0.35,
  ridgeMix: 0.45,
  continents: 0.6,
  islands: 0.35,
  craterMix: 0.0,
  craterDensity: 10.0,
  seaLevel: 0.0,
  lowColor: '#16335e',
  shoreColor: '#2f6f8f',
  midColor: '#3f7d3a',
  highColor: '#cbb89a',
  iceLatitude: 0.82,
  iceColor: '#eef2f5',
  cityLights: false,
  lavaLevel: 0.0,
  lavaColor: '#2a0d08',
  emberColor: '#ff5a1e',
  emissiveStrength: 0.0,
  oceanEnabled: true,
  deepColor: '#0a2547',
  shallowColor: '#2e7fae',
  waterOpacity: 0.82,
  cloudsEnabled: true,
  cloudColor: '#f4f8ff',
  cloudCoverage: 0.42,
  cloudOpacity: 0.9,
  cloudSpeed: 0.015,
  atmosphereEnabled: true,
  atmosphereColor: '#5b8cff',
  atmosphereDensity: 1.1,
  atmospherePower: 3.2,
  ringsEnabled: false,
  ringInnerColor: '#cbb79a',
  ringOuterColor: '#7d6c54',
  ringOpacity: 0.85,
  ringTilt: 20,
  autoRotate: true,
}

export const usePlanetStore = create<PlanetState>((set) => ({
  params: { ...DEFAULT_PARAMS },
  locks: { shape: false, palette: false, climate: false },
  setParam: (key, value) =>
    set((s) => ({ params: { ...s.params, [key]: value } })),
  setParams: (patch) => set((s) => ({ params: { ...s.params, ...patch } })),
  setLock: (group, value) => set((s) => ({ locks: { ...s.locks, [group]: value } })),
  randomizeSeed: () => {
    const seed = randomSeed()
    set((s) => ({ params: { ...s.params, seed } }))
    return seed
  },
}))
