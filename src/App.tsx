import { Leva } from 'leva'
import { PlanetCanvas } from '@/scene/PlanetCanvas'
import { ControlPanel } from '@/ui/ControlPanel'
import { ExportOverlay } from '@/ui/ExportOverlay'
import { Gallery } from '@/ui/Gallery'
import { PlanetName } from '@/ui/PlanetName'
import { ErrorBoundary } from '@/ui/ErrorBoundary'
import { supportsWebGL2 } from '@/lib/webgl'

export default function App() {
  // Fail gracefully instead of rendering a blank canvas on unsupported browsers.
  if (!supportsWebGL2()) {
    return (
      <div className="app-fallback">
        <h1>WebGL 2 required</h1>
        <p>
          Planets Creator renders planets with WebGL 2, which this browser doesn&apos;t
          support. Try a recent version of Chrome, Edge, Firefox, or Safari.
        </p>
      </div>
    )
  }

  // Collapse the controls by default on phones so they don't cover the planet.
  const compact = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <ErrorBoundary>
      <div className="app-title">Planets Creator</div>
      <Gallery />
      <PlanetName />
      <PlanetCanvas />
      <ControlPanel />
      <ExportOverlay />
      <Leva collapsed={compact} />
    </ErrorBoundary>
  )
}
