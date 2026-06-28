import { Color, NormalBlending, ShaderMaterial } from 'three'
import vertexShader from '@/gfx/shaders/shell.vert.glsl'
import fragmentShader from '@/gfx/shaders/cloud.frag.glsl'
import { CLOUD_SCALE, STAR_DIRECTION } from '@/constants'

export function createCloudMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: STAR_DIRECTION.clone() },
      uColor: { value: new Color('#f4f8ff') },
      uCoverage: { value: 0.5 },
      uOpacity: { value: 0.9 },
      uScale: { value: CLOUD_SCALE },
      uSpeed: { value: 0.015 },
    },
  })
}
