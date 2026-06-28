import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, SphereGeometry } from 'three'
import { createCloudMaterial } from '@/gfx/materials/createCloudMaterial'
import { usePlanetStore, type PlanetParams } from '@/state/usePlanetStore'
import { BASE_RADIUS, CLOUD_RADIUS_FACTOR } from '@/constants'

/** Clouds: a translucent shell that co-rotates with the planet and drifts. */
export function CloudShell() {
  const meshRef = useRef<Mesh>(null!)
  const material = useMemo(() => createCloudMaterial(), [])
  const geometry = useMemo(
    () => new SphereGeometry(BASE_RADIUS * CLOUD_RADIUS_FACTOR, 96, 96),
    [],
  )

  useEffect(() => {
    const apply = (p: PlanetParams) => {
      const u = material.uniforms
      u.uColor.value.set(p.cloudColor)
      u.uCoverage.value = p.cloudCoverage
      u.uOpacity.value = p.cloudOpacity
      u.uSpeed.value = p.cloudSpeed
    }
    apply(usePlanetStore.getState().params)
    return usePlanetStore.subscribe((s, prev) => {
      if (s.params !== prev.params) apply(s.params)
    })
  }, [material])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  useFrame((state, dt) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    // Drift slightly faster than the surface so clouds move relative to land.
    if (usePlanetStore.getState().params.autoRotate) {
      meshRef.current.rotation.y += dt * 0.062
    }
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={2} />
}
