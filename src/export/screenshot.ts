import { exportApi } from './exportApi'
import { downloadBlob } from '@/lib/download'
import { usePlanetStore } from '@/state/usePlanetStore'
import { planetSlug } from '@/planet/nameGen'

/**
 * Save a PNG of the current view. Reads the live canvas directly, so it captures
 * exactly what's on screen — bloom, tone mapping, shells and all. Requires
 * `preserveDrawingBuffer: true` on the renderer (see PlanetCanvas) so the composed
 * frame is still readable when toBlob runs.
 */
export function captureScreenshot(): void {
  const renderer = exportApi.renderer
  if (!renderer) return
  const canvas = renderer.domElement
  // Defer one frame so the most recent composited frame is present.
  requestAnimationFrame(() => {
    canvas.toBlob((blob) => {
      if (!blob) return
      downloadBlob(blob, `${planetSlug(usePlanetStore.getState().params.seed)}.png`)
    }, 'image/png')
  })
}
