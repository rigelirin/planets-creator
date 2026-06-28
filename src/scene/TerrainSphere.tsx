import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, type Material } from 'three'
import { createCubeSphereGeometry } from '@/gfx/geometry/cubeSphere'
import { createTerrainMaterial, createTerrainUniforms } from '@/gfx/materials/createTerrainMaterial'
import { applyTerrainParams } from '@/state/uniformsBridge'
import { usePlanetStore } from '@/state/usePlanetStore'
import { BASE_RADIUS, LIVE_FACE_SUBDIV } from '@/constants'

export function TerrainSphere() {
  const meshRef = useRef<Mesh>(null!)
  const uniforms = useMemo(() => createTerrainUniforms(), [])
  const geometry = useMemo(() => createCubeSphereGeometry(BASE_RADIUS, LIVE_FACE_SUBDIV), [])
  const material = useMemo(() => createTerrainMaterial(uniforms), [uniforms])

  // Imperative store -> uniform bridge (no React re-render on edit).
  useEffect(() => {
    applyTerrainParams(uniforms, usePlanetStore.getState().params)
    return usePlanetStore.subscribe((s, prev) => {
      if (s.params !== prev.params) applyTerrainParams(uniforms, s.params)
    })
  }, [uniforms])

  // Dispose GPU resources on unmount.
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame((_, dt) => {
    if (usePlanetStore.getState().params.autoRotate) {
      meshRef.current.rotation.y += dt * 0.05
    }
  })

  return <mesh ref={meshRef} geometry={geometry} material={material as unknown as Material} />
}
