import type { PlanetParams } from '@/state/usePlanetStore'

/**
 * Bridge so UI outside the leva panel (e.g. the preset gallery) can apply a param
 * change and keep the panel's controls in sync. ControlPanel registers `apply` on
 * mount (it owns leva's `set`); callers do `levaSync.apply(applyArchetype(id))`.
 */
export const levaSync: { apply: (params: PlanetParams) => void } = {
  apply: () => {},
}
