import { AdditiveBlending, BackSide, Color, ShaderMaterial } from 'three'
import vertexShader from '@/gfx/shaders/shell.vert.glsl'
import fragmentShader from '@/gfx/shaders/atmosphere.frag.glsl'
import { STAR_DIRECTION } from '@/constants'

export function createAtmosphereMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: BackSide,
    blending: AdditiveBlending,
    uniforms: {
      uSunDir: { value: STAR_DIRECTION.clone() },
      uColor: { value: new Color('#5b8cff') },
      uPower: { value: 3.2 },
      uDensity: { value: 1.1 },
    },
  })
}
