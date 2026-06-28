import type { TerrainUniforms } from '@/gfx/materials/createTerrainMaterial'
import type { PlanetParams } from '@/state/usePlanetStore'
import { seedToOffset } from '@/planet/seed'

/**
 * Imperative store -> uniform bridge. Mutates the shared uniform object in place;
 * R3F's render loop picks up the new .value next frame. No setState, no React
 * re-render, so dragging a slider is hitch-free.
 */
export function applyTerrainParams(u: TerrainUniforms, p: PlanetParams): void {
  // Seed -> deterministic domain offset (mutates the Vector3 in place).
  seedToOffset(p.seed, u.uSeedOffset.value)

  u.uBaseFrequency.value = p.baseFrequency
  u.uAmplitude.value = p.amplitude
  u.uOctaves.value = p.octaves
  u.uLacunarity.value = p.lacunarity
  u.uGain.value = p.gain
  u.uWarp.value = p.warp
  u.uRidgeMix.value = p.ridgeMix
  u.uContinents.value = p.continents
  u.uIslands.value = p.islands
  u.uCraterMix.value = p.craterMix
  u.uCraterDensity.value = p.craterDensity
  u.uSeaLevel.value = p.seaLevel

  u.uLowColor.value.set(p.lowColor)
  u.uShoreColor.value.set(p.shoreColor)
  u.uMidColor.value.set(p.midColor)
  u.uHighColor.value.set(p.highColor)

  u.uIceLatitude.value = p.iceLatitude
  u.uIceColor.value.set(p.iceColor)
  u.uCityLights.value = p.cityLights ? 1 : 0
  u.uGaseous.value = p.surfaceModel === 'gaseous' ? 1 : 0

  u.uLavaLevel.value = p.lavaLevel
  u.uLavaColor.value.set(p.lavaColor)
  u.uEmberColor.value.set(p.emberColor)
  u.uEmissiveStrength.value = p.emissiveStrength
}
