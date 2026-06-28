import { Group, Mesh } from 'three'
import { exportApi } from './exportApi'
import { useExportStore } from './useExportStore'
import { usePlanetStore } from '@/state/usePlanetStore'
import { planetSlug } from '@/planet/nameGen'

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)))

/** Free every baked mesh's geometry, textures (deduped) and material in a group. */
function disposeGroup(group: Group): void {
  group.traverse((obj) => {
    const mesh = obj as Mesh
    if (!mesh.isMesh) return
    mesh.geometry?.dispose()
    const mat = mesh.material as unknown as Record<string, { dispose?: () => void } | undefined> & {
      dispose?: () => void
    }
    const maps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap']
    const textures = new Set(maps.map((k) => mat[k]).filter(Boolean))
    textures.forEach((t) => (t as { dispose?: () => void }).dispose?.())
    mat.dispose?.()
  })
}

/** Bake the current planet and download it as a GLB. Drives the status overlay. */
export async function runExport(): Promise<void> {
  const { setStatus } = useExportStore.getState()
  const renderer = exportApi.renderer
  if (!renderer) {
    setStatus('error', 'Renderer not ready — try again in a moment.')
    return
  }

  try {
    setStatus('baking', 'Loading exporter…')
    await nextFrame()
    // Lazy-load the bake + exporter code so it stays out of the initial bundle.
    const [bake, exporters] = await Promise.all([import('./bakePlanet'), import('./exportGLB')])
    const { BAKE_PRESETS, bakePlanetMesh, bakeCloudMesh } = bake

    setStatus('baking', 'Baking textures & mesh…')
    await nextFrame() // let the overlay paint before the heavy synchronous bake

    const params = usePlanetStore.getState().params
    const res = BAKE_PRESETS[useExportStore.getState().resolution]
    const format = useExportStore.getState().format
    const name = planetSlug(params.seed)

    const planet = bakePlanetMesh(renderer, params, res)
    const group = new Group()
    group.add(planet)
    // Clouds export as their own transparent node so the layer can be toggled.
    if (params.cloudsEnabled) group.add(bakeCloudMesh(renderer, params))

    setStatus('baking', `Encoding ${format.toUpperCase()}…`)
    await nextFrame()
    // STL/OBJ are geometry formats (print/CAD) — just the solid planet; the
    // textured formats get the full group (planet + clouds).
    switch (format) {
      case 'stl': await exporters.exportSTL(planet, `${name}.stl`); break
      case 'obj': await exporters.exportOBJ(planet, `${name}.obj`); break
      case 'gltf': await exporters.exportGLTF(group, `${name}.gltf`); break
      case 'usdz': await exporters.exportUSDZ(group, `${name}.usdz`); break
      default: await exporters.exportGLB(group, `${name}.glb`)
    }

    disposeGroup(group)

    setStatus('done', 'Exported ✓')
    setTimeout(() => useExportStore.getState().setStatus('idle', ''), 1800)
  } catch (err) {
    console.error('[export] failed', err)
    setStatus('error', err instanceof Error ? err.message : 'Export failed')
    setTimeout(() => useExportStore.getState().setStatus('idle', ''), 3500)
  }
}
