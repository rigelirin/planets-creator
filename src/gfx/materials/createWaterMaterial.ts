import { Color, ShaderMaterial } from 'three'
import vertexShader from '@/gfx/shaders/shell.vert.glsl'
import fragmentShader from '@/gfx/shaders/water.frag.glsl'
import { STAR_COLOR, STAR_DIRECTION } from '@/constants'

export function createWaterMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: STAR_DIRECTION.clone() },
      uSunColor: { value: new Color(STAR_COLOR) },
      uDeepColor: { value: new Color('#0a2547') },
      uShallowColor: { value: new Color('#2e7fae') },
      uOpacity: { value: 0.82 },
    },
  })
}
