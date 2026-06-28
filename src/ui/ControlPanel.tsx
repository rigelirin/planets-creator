import { useEffect, useRef } from 'react'
import { button, folder, useControls } from 'leva'
import { usePlanetStore, type ArchetypeId, type PlanetParams } from '@/state/usePlanetStore'
import { applyArchetype, ARCHETYPE_LIST } from '@/planet/archetypes'
import { randomize } from '@/planet/randomize'
import {
  parsePresetJson,
  presetJson,
  readShareHash,
  shareUrl,
  writeShareHash,
} from '@/planet/serialize'
import { downloadBlob } from '@/lib/download'
import { runExport } from '@/export/runExport'
import { captureScreenshot } from '@/export/screenshot'
import { useExportStore, type ExportFormat, type ResolutionName } from '@/export/useExportStore'
import { levaSync } from './levaSync'

/** Archetype label -> id, for the leva dropdown. */
const ARCHETYPE_OPTIONS: Record<string, ArchetypeId> = Object.fromEntries(
  ARCHETYPE_LIST.map((a) => [a.label, a.id]),
) as Record<string, ArchetypeId>

/**
 * Every leva control key mapped to its param value. Used to mirror a programmatic
 * param change (archetype switch, randomize, share-link / preset load) back into
 * the leva UI. `Archetype` is safe to include because its onChange no-ops when the
 * value already matches the store (see the guard below).
 */
function levaFromParams(p: PlanetParams) {
  return {
    Archetype: p.archetype,
    seed: p.seed,
    baseFrequency: p.baseFrequency,
    amplitude: p.amplitude,
    octaves: p.octaves,
    lacunarity: p.lacunarity,
    gain: p.gain,
    warp: p.warp,
    ridgeMix: p.ridgeMix,
    continents: p.continents,
    islands: p.islands,
    craterMix: p.craterMix,
    craterDensity: p.craterDensity,
    seaLevel: p.seaLevel,
    lowColor: p.lowColor,
    shoreColor: p.shoreColor,
    midColor: p.midColor,
    highColor: p.highColor,
    iceLatitude: p.iceLatitude,
    iceColor: p.iceColor,
    cityLights: p.cityLights,
    lavaLevel: p.lavaLevel,
    lavaColor: p.lavaColor,
    emberColor: p.emberColor,
    emissiveStrength: p.emissiveStrength,
    oceanEnabled: p.oceanEnabled,
    deepColor: p.deepColor,
    shallowColor: p.shallowColor,
    waterOpacity: p.waterOpacity,
    cloudsEnabled: p.cloudsEnabled,
    cloudColor: p.cloudColor,
    cloudCoverage: p.cloudCoverage,
    cloudOpacity: p.cloudOpacity,
    cloudSpeed: p.cloudSpeed,
    atmosphereEnabled: p.atmosphereEnabled,
    atmosphereColor: p.atmosphereColor,
    atmosphereDensity: p.atmosphereDensity,
    atmospherePower: p.atmospherePower,
    autoRotate: p.autoRotate,
  }
}

/** Flash a transient message in the bottom status pill. */
function flash(message: string) {
  useExportStore.getState().setStatus('done', message)
  setTimeout(() => useExportStore.getState().setStatus('idle', ''), 1600)
}

/**
 * Control panel. leva's transient `onChange` writes straight to the store (and
 * thus, via each component's bridge, to shader uniforms) WITHOUT re-rendering
 * this component or the scene. Programmatic changes (archetype / randomize /
 * share-load) write the store directly, then mirror back into leva via
 * `set(levaFromParams(...))`.
 */
export function ControlPanel() {
  const { setParam, setLock, params, locks } = usePlanetStore.getState()
  const fileRef = useRef<HTMLInputElement>(null)
  const num = <K extends keyof typeof params>(key: K) => (v: number) =>
    setParam(key, v as (typeof params)[K])
  const str = <K extends keyof typeof params>(key: K) => (v: string) =>
    setParam(key, v as (typeof params)[K])
  const bool = <K extends keyof typeof params>(key: K) => (v: boolean) =>
    setParam(key, v as (typeof params)[K])

  const [, set] = useControls(() => ({
    Archetype: {
      options: ARCHETYPE_OPTIONS,
      value: params.archetype,
      onChange: (id: ArchetypeId, _path, ctx?: { initial?: boolean }) => {
        // Skip the mount call and any echo where the value already matches the
        // store (the latter is what makes share-load / randomize mirrors safe).
        if (ctx?.initial || id === usePlanetStore.getState().params.archetype) return
        set(levaFromParams(applyArchetype(id)))
      },
    },
    seed: { value: params.seed, onChange: str('seed') },
    Randomize: button(() => {
      set(levaFromParams(randomize(usePlanetStore.getState().locks)))
    }),
    Locks: folder(
      {
        lockShape: { label: 'Lock shape', value: locks.shape, onChange: (v: boolean) => setLock('shape', v) },
        lockPalette: { label: 'Lock palette', value: locks.palette, onChange: (v: boolean) => setLock('palette', v) },
        lockClimate: { label: 'Lock climate', value: locks.climate, onChange: (v: boolean) => setLock('climate', v) },
      },
      { collapsed: true },
    ),
    Terrain: folder({
      baseFrequency: { label: 'Frequency', value: params.baseFrequency, min: 0.2, max: 5, step: 0.01, onChange: num('baseFrequency') },
      amplitude: { label: 'Height', value: params.amplitude, min: 0, max: 0.3, step: 0.005, onChange: num('amplitude') },
      octaves: { value: params.octaves, min: 1, max: 8, step: 1, onChange: num('octaves') },
      lacunarity: { value: params.lacunarity, min: 1.5, max: 3.5, step: 0.05, onChange: num('lacunarity') },
      gain: { value: params.gain, min: 0.2, max: 0.8, step: 0.01, onChange: num('gain') },
      warp: { label: 'Domain warp', value: params.warp, min: 0, max: 1.5, step: 0.01, onChange: num('warp') },
      ridgeMix: { label: 'Mountains', value: params.ridgeMix, min: 0, max: 1, step: 0.01, onChange: num('ridgeMix') },
      continents: { label: 'Continents', value: params.continents, min: 0, max: 1, step: 0.01, onChange: num('continents') },
      islands: { label: 'Islands', value: params.islands, min: 0, max: 1, step: 0.01, onChange: num('islands') },
      craterMix: { label: 'Craters', value: params.craterMix, min: 0, max: 1, step: 0.01, onChange: num('craterMix') },
      craterDensity: { label: 'Crater density', value: params.craterDensity, min: 4, max: 24, step: 0.5, onChange: num('craterDensity') },
      seaLevel: { label: 'Sea level', value: params.seaLevel, min: -0.5, max: 0.5, step: 0.005, onChange: num('seaLevel') },
    }),
    Palette: folder({
      lowColor: { label: 'Floor deep', value: params.lowColor, onChange: str('lowColor') },
      shoreColor: { label: 'Floor shallow', value: params.shoreColor, onChange: str('shoreColor') },
      midColor: { label: 'Land', value: params.midColor, onChange: str('midColor') },
      highColor: { label: 'Peaks', value: params.highColor, onChange: str('highColor') },
    }),
    Climate: folder({
      iceLatitude: { label: 'Ice line', value: params.iceLatitude, min: 0.3, max: 1.2, step: 0.01, onChange: num('iceLatitude') },
      iceColor: { label: 'Ice', value: params.iceColor, onChange: str('iceColor') },
      cityLights: { label: 'City lights', value: params.cityLights, onChange: bool('cityLights') },
    }),
    Volcanic: folder(
      {
        emissiveStrength: { label: 'Lava glow', value: params.emissiveStrength, min: 0, max: 3, step: 0.05, onChange: num('emissiveStrength') },
        lavaLevel: { label: 'Lava level', value: params.lavaLevel, min: -0.5, max: 0.5, step: 0.005, onChange: num('lavaLevel') },
        lavaColor: { label: 'Crust', value: params.lavaColor, onChange: str('lavaColor') },
        emberColor: { label: 'Ember', value: params.emberColor, onChange: str('emberColor') },
      },
      { collapsed: true },
    ),
    Ocean: folder({
      oceanEnabled: { label: 'Enabled', value: params.oceanEnabled, onChange: bool('oceanEnabled') },
      deepColor: { label: 'Deep', value: params.deepColor, onChange: str('deepColor') },
      shallowColor: { label: 'Shallow', value: params.shallowColor, onChange: str('shallowColor') },
      waterOpacity: { label: 'Opacity', value: params.waterOpacity, min: 0, max: 1, step: 0.01, onChange: num('waterOpacity') },
    }),
    Clouds: folder({
      cloudsEnabled: { label: 'Enabled', value: params.cloudsEnabled, onChange: bool('cloudsEnabled') },
      cloudColor: { label: 'Color', value: params.cloudColor, onChange: str('cloudColor') },
      cloudCoverage: { label: 'Coverage', value: params.cloudCoverage, min: 0, max: 1, step: 0.01, onChange: num('cloudCoverage') },
      cloudOpacity: { label: 'Opacity', value: params.cloudOpacity, min: 0, max: 1, step: 0.01, onChange: num('cloudOpacity') },
      cloudSpeed: { label: 'Drift', value: params.cloudSpeed, min: 0, max: 0.1, step: 0.001, onChange: num('cloudSpeed') },
    }),
    Atmosphere: folder({
      atmosphereEnabled: { label: 'Enabled', value: params.atmosphereEnabled, onChange: bool('atmosphereEnabled') },
      atmosphereColor: { label: 'Color', value: params.atmosphereColor, onChange: str('atmosphereColor') },
      atmosphereDensity: { label: 'Density', value: params.atmosphereDensity, min: 0, max: 3, step: 0.05, onChange: num('atmosphereDensity') },
      atmospherePower: { label: 'Falloff', value: params.atmospherePower, min: 1, max: 8, step: 0.1, onChange: num('atmospherePower') },
    }),
    Scene: folder({
      autoRotate: { label: 'Auto-rotate', value: params.autoRotate, onChange: bool('autoRotate') },
    }),
    Share: folder(
      {
        'Copy link': button(() => {
          navigator.clipboard
            ?.writeText(shareUrl(usePlanetStore.getState().params))
            .then(() => flash('Share link copied ✓'))
            .catch(() => flash('Copy failed — clipboard blocked'))
        }),
        'Save preset': button(() => {
          const p = usePlanetStore.getState().params
          downloadBlob(new Blob([presetJson(p)], { type: 'application/json' }), `${p.seed || 'planet'}.json`)
        }),
        'Load preset': button(() => fileRef.current?.click()),
      },
      { collapsed: true },
    ),
    Export: folder({
      format: {
        options: {
          'GLB (textured)': 'glb',
          'glTF (textured)': 'gltf',
          'STL (3D print)': 'stl',
          'OBJ (geometry)': 'obj',
          'USDZ (AR)': 'usdz',
        },
        value: useExportStore.getState().format,
        onChange: (v: string) => useExportStore.getState().setFormat(v as ExportFormat),
      },
      resolution: {
        options: ['Preview', 'Standard', 'High'],
        value: useExportStore.getState().resolution,
        onChange: (v: string) => useExportStore.getState().setResolution(v as ResolutionName),
      },
      'Download model': button(() => runExport()),
      'Screenshot .png': button(() => captureScreenshot()),
    }),
  }))

  // On mount: restore from a share link if present, then keep the hash in sync
  // (debounced) so a refresh or copy-paste reproduces the exact planet.
  useEffect(() => {
    // Let outside UI (preset gallery) mirror programmatic changes into the panel.
    levaSync.apply = (p) => set(levaFromParams(p))

    const loaded = readShareHash()
    if (loaded) {
      usePlanetStore.getState().setParams(loaded)
      set(levaFromParams(loaded))
    }
    let t: number | undefined
    const unsub = usePlanetStore.subscribe((s, prev) => {
      if (s.params === prev.params) return
      clearTimeout(t)
      t = window.setTimeout(() => writeShareHash(usePlanetStore.getState().params), 400)
    })
    return () => {
      clearTimeout(t)
      unsub()
    }
  }, [set])

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-loading the same file
    if (!file) return
    const loaded = parsePresetJson(await file.text())
    if (loaded) {
      usePlanetStore.getState().setParams(loaded)
      set(levaFromParams(loaded))
      flash('Preset loaded ✓')
    } else {
      flash('Invalid preset file')
    }
  }

  return (
    <input
      ref={fileRef}
      type="file"
      accept="application/json,.json"
      style={{ display: 'none' }}
      onChange={onFile}
    />
  )
}
