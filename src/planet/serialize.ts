import {
  DEFAULT_PARAMS,
  type ArchetypeId,
  type PlanetParams,
} from '@/state/usePlanetStore'

/** Bump if the serialized shape changes incompatibly. */
const VERSION = 1

const ARCHETYPE_IDS: ArchetypeId[] = [
  'continental', 'ocean', 'desert', 'arctic', 'volcanic', 'barren', 'gasgiant',
]

// --- UTF-8-safe base64url -----------------------------------------------------

function toB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64Url(s: string): string {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * Keep only known keys whose runtime type matches the default — so a malformed
 * or stale link degrades to defaults per-field instead of corrupting uniforms.
 */
function sanitize(raw: Record<string, unknown>): PlanetParams {
  const out = { ...DEFAULT_PARAMS } as Record<string, unknown>
  for (const key of Object.keys(DEFAULT_PARAMS) as (keyof PlanetParams)[]) {
    const v = raw[key]
    if (typeof v === typeof DEFAULT_PARAMS[key]) out[key] = v
  }
  if (!ARCHETYPE_IDS.includes(out.archetype as ArchetypeId)) {
    out.archetype = DEFAULT_PARAMS.archetype
  }
  if (out.surfaceModel !== 'terrestrial' && out.surfaceModel !== 'gaseous') {
    out.surfaceModel = DEFAULT_PARAMS.surfaceModel
  }
  return out as PlanetParams
}

// --- URL-hash sharing ---------------------------------------------------------

export function encodeParams(p: PlanetParams): string {
  return toB64Url(JSON.stringify({ v: VERSION, p }))
}

export function decodeParams(str: string): PlanetParams | null {
  try {
    const obj = JSON.parse(fromB64Url(str)) as { v?: number; p?: Record<string, unknown> }
    if (!obj || obj.v !== VERSION || !obj.p) return null
    return sanitize(obj.p)
  } catch {
    return null
  }
}

/** Parse the current `#p=…` hash into params, or null if absent/invalid. */
export function readShareHash(): PlanetParams | null {
  const m = window.location.hash.match(/[#&]p=([^&]+)/)
  return m ? decodeParams(m[1]) : null
}

/** Write params to the hash without adding a history entry. */
export function writeShareHash(p: PlanetParams): void {
  window.history.replaceState(null, '', `#p=${encodeParams(p)}`)
}

/** Full, copy-pasteable share URL for the given params. */
export function shareUrl(p: PlanetParams): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#p=${encodeParams(p)}`
}

// --- JSON preset files --------------------------------------------------------

export function presetJson(p: PlanetParams): string {
  return JSON.stringify({ v: VERSION, p }, null, 2)
}

export function parsePresetJson(text: string): PlanetParams | null {
  try {
    const obj = JSON.parse(text) as { v?: number; p?: Record<string, unknown> }
    if (!obj || obj.v !== VERSION || !obj.p) return null
    return sanitize(obj.p)
  } catch {
    return null
  }
}
