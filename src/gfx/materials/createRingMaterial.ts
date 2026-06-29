import { Color, DoubleSide, NormalBlending, ShaderMaterial, Vector3 } from 'three'
import vertexShader from '@/gfx/shaders/shell.vert.glsl'
import fragmentShader from '@/gfx/shaders/ring.frag.glsl'
import { STAR_DIRECTION } from '@/constants'

/**
 * Planetary ring material: a transparent, double-sided disc whose concentric
 * colour/opacity bands come from the shared lib/rings.glsl pattern (so the live
 * ring and the exported ring texture match). depthWrite is off so it blends over
 * the shells; the opaque planet still depth-occludes the far arc.
 */
export function createRingMaterial(innerRadius: number, outerRadius: number): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: STAR_DIRECTION.clone() },
      uInnerRadius: { value: innerRadius },
      uOuterRadius: { value: outerRadius },
      uInnerColor: { value: new Color('#cbb79a') },
      uOuterColor: { value: new Color('#7d6c54') },
      uOpacity: { value: 0.85 },
      uSeed: { value: new Vector3() },
    },
  })
}
