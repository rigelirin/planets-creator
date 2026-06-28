import { usePlanetStore } from '@/state/usePlanetStore'
import { planetName } from '@/planet/nameGen'

/** The current planet's generated name, shown top-left; updates with the seed. */
export function PlanetName() {
  const seed = usePlanetStore((s) => s.params.seed)
  return <div className="planet-name">{planetName(seed)}</div>
}
