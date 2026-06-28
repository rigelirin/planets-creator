import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { Color, MeshStandardMaterial, Vector3 } from 'three'
import vertexShader from '@/gfx/shaders/terrain.csm.vert.glsl'
import fragmentShader from '@/gfx/shaders/terrain.csm.frag.glsl'
import { STAR_DIRECTION } from '@/constants'

/**
 * Uniform set for the terrain material. The same object instance is shared with
 * the store->uniform bridge (mutated in place) and, later, with the export bake
 * passes — so live and baked planets read identical values.
 */
export type TerrainUniforms = {
  uSeedOffset: { value: Vector3 }
  uBaseFrequency: { value: number }
  uAmplitude: { value: number }
  uOctaves: { value: number }
  uLacunarity: { value: number }
  uGain: { value: number }
  uWarp: { value: number }
  uRidgeMix: { value: number }
  uContinents: { value: number }
  uIslands: { value: number }
  uCraterMix: { value: number }
  uCraterDensity: { value: number }
  uSeaLevel: { value: number }
  uLowColor: { value: Color }
  uShoreColor: { value: Color }
  uMidColor: { value: Color }
  uHighColor: { value: Color }
  uIceLatitude: { value: number }
  uIceColor: { value: Color }
  uCityLights: { value: number }
  uGaseous: { value: number }
  uSunDir: { value: Vector3 }
  uLavaLevel: { value: number }
  uLavaColor: { value: Color }
  uEmberColor: { value: Color }
  uEmissiveStrength: { value: number }
}

export function createTerrainUniforms(): TerrainUniforms {
  return {
    uSeedOffset: { value: new Vector3(0, 0, 0) },
    uBaseFrequency: { value: 1.5 },
    uAmplitude: { value: 0.08 },
    uOctaves: { value: 6 },
    uLacunarity: { value: 2.0 },
    uGain: { value: 0.5 },
    uWarp: { value: 0.35 },
    uRidgeMix: { value: 0.45 },
    uContinents: { value: 0.6 },
    uIslands: { value: 0.35 },
    uCraterMix: { value: 0.0 },
    uCraterDensity: { value: 10.0 },
    uSeaLevel: { value: 0.0 },
    uLowColor: { value: new Color('#16335e') },
    uShoreColor: { value: new Color('#2f6f8f') },
    uMidColor: { value: new Color('#3f7d3a') },
    uHighColor: { value: new Color('#cbb89a') },
    uIceLatitude: { value: 0.82 },
    uIceColor: { value: new Color('#eef2f5') },
    uCityLights: { value: 0.0 },
    uGaseous: { value: 0.0 },
    uSunDir: { value: STAR_DIRECTION.clone() },
    uLavaLevel: { value: 0.0 },
    uLavaColor: { value: new Color('#2a0d08') },
    uEmberColor: { value: new Color('#ff5a1e') },
    uEmissiveStrength: { value: 0.0 },
  }
}

export function createTerrainMaterial(uniforms: TerrainUniforms): CustomShaderMaterial {
  return new CustomShaderMaterial({
    baseMaterial: MeshStandardMaterial,
    vertexShader,
    fragmentShader,
    uniforms: uniforms as unknown as Record<string, { value: unknown }>,
    metalness: 0.0,
    roughness: 0.9,
  })
}
