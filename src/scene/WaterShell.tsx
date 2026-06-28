import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, SphereGeometry } from 'three'
import { createWaterMaterial } from '@/gfx/materials/createWaterMaterial'
import { usePlanetStore, type PlanetParams } from '@/state/usePlanetStore'
import { BASE_RADIUS } from '@/constants'

/** Ocean: a smooth sphere at the sea-level radius, drawn over the terrain. */
export function WaterShell() {
  const meshRef = useRef<Mesh>(null!)
  const material = useMemo(() => createWaterMaterial(), [])
  const geometry = useMemo(() => new SphereGeometry(BASE_RADIUS, 128, 128), [])

  useEffect(() => {
    const apply = (p: PlanetParams) => {
      const u = material.uniforms
      u.uDeepColor.value.set(p.deepColor)
      u.uShallowColor.value.set(p.shallowColor)
      u.uOpacity.value = p.waterOpacity
      // Sit exactly at the terrain's sea-level surface.
      const r = BASE_RADIUS * (1 + p.seaLevel * p.amplitude)
      meshRef.current?.scale.setScalar(r)
    }
    apply(usePlanetStore.getState().params)
    return usePlanetStore.subscribe((s, prev) => {
      if (s.params !== prev.params) apply(s.params)
    })
  }, [material])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={1} />
}
