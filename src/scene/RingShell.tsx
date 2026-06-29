import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Mesh, RingGeometry, Vector3 } from 'three'
import { createRingMaterial } from '@/gfx/materials/createRingMaterial'
import { seedToOffset } from '@/planet/seed'
import { usePlanetStore, type PlanetParams } from '@/state/usePlanetStore'
import {
  BASE_RADIUS,
  RING_INNER_FACTOR,
  RING_OUTER_FACTOR,
  RING_SPIN_SPEED,
  RING_THETA_SEGMENTS,
} from '@/constants'

const RING_INNER = BASE_RADIUS * RING_INNER_FACTOR
const RING_OUTER = BASE_RADIUS * RING_OUTER_FACTOR

// Reused scratch so seed-driven uniform updates never allocate.
const tmpSeed = new Vector3()

/**
 * Saturn-like ring system: a flat, tilted annulus of concentric colour/opacity
 * bands (Cassini-style gaps), lit by the sun. It is an orbital plane, NOT part
 * of the planet body, so it never co-rotates with the terrain - it stays fixed
 * in space (with an optional, very slow independent drift). Rendered
 * double-sided + transparent; the opaque planet depth-occludes the far arc.
 *
 * Geometry note: the disc is centred on the planet (origin) and every transform
 * here is a rotation about the origin, which preserves distance from it. So the
 * fragment shader can recover the band coordinate as length(worldPos) and reuse
 * the shared shell.vert.glsl - no dedicated ring vertex shader is required.
 */
export function RingShell() {
  const meshRef = useRef<Mesh>(null!)
  const material = useMemo(() => createRingMaterial(RING_INNER, RING_OUTER), [])
  const geometry = useMemo(() => {
    // RingGeometry is born in the XY plane (normal +Z). Bake a -90deg turn about
    // X so it lies in the equatorial XZ plane (normal +Y); the mesh's own X
    // rotation then expresses the human-meaningful tilt away from edge-on.
    // 1 radial segment is exact (bands are computed per-fragment from radius).
    const g = new RingGeometry(RING_INNER, RING_OUTER, RING_THETA_SEGMENTS, 1)
    g.rotateX(-Math.PI / 2)
    return g
  }, [])

  useEffect(() => {
    const apply = (p: PlanetParams) => {
      const u = material.uniforms
      u.uInnerColor.value.set(p.ringInnerColor)
      u.uOuterColor.value.set(p.ringOuterColor)
      u.uOpacity.value = p.ringOpacity
      // Seed offset lets the band pattern vary per planet (shader decides usage).
      u.uSeed.value.copy(seedToOffset(p.seed, tmpSeed))
      // Tilt is the angle from the (edge-on) equatorial plane; 0 = a thin line.
      meshRef.current.rotation.x = MathUtils.degToRad(p.ringTilt)
    }
    apply(usePlanetStore.getState().params)
    return usePlanetStore.subscribe((s, prev) => {
      if (s.params !== prev.params) apply(s.params)
    })
  }, [material])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  useFrame((state, dt) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    // Independent orbital plane. With Euler 'XYZ', incrementing rotation.y spins
    // the disc within its own plane (applied before the X tilt), so any
    // seed-varied azimuthal detail drifts slowly. Disabled by default
    // (RING_SPIN_SPEED = 0) because radial bands are rotationally symmetric.
    if (RING_SPIN_SPEED > 0 && usePlanetStore.getState().params.autoRotate) {
      meshRef.current.rotation.y += dt * RING_SPIN_SPEED
    }
  })

  // renderOrder 4: drawn after the opaque planet (0) and the ocean/cloud/
  // atmosphere shells (1/2/3) so the near arc blends over them. depthWrite:false
  // (set on the material) keeps it from occluding the shells, while the default
  // depthTest lets the opaque planet hide the far arc passing behind it.
  return <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={4} />
}
