import { useEffect, useMemo } from 'react'
import { Mesh, SphereGeometry } from 'three'
import { createAtmosphereMaterial } from '@/gfx/materials/createAtmosphereMaterial'
import { usePlanetStore, type PlanetParams } from '@/state/usePlanetStore'
import { ATMOSPHERE_RADIUS_FACTOR, BASE_RADIUS } from '@/constants'

/** Atmosphere: a back-side fresnel glow shell (fed into Bloom). */
export function AtmosphereShell() {
  const material = useMemo(() => createAtmosphereMaterial(), [])
  const geometry = useMemo(
    () => new SphereGeometry(BASE_RADIUS * ATMOSPHERE_RADIUS_FACTOR, 64, 64),
    [],
  )

  useEffect(() => {
    const apply = (p: PlanetParams) => {
      const u = material.uniforms
      u.uColor.value.set(p.atmosphereColor)
      u.uDensity.value = p.atmosphereDensity
      u.uPower.value = p.atmospherePower
    }
    apply(usePlanetStore.getState().params)
    return usePlanetStore.subscribe((s, prev) => {
      if (s.params !== prev.params) apply(s.params)
    })
  }, [material])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  return <mesh geometry={geometry} material={material} renderOrder={3} />
}
