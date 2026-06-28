import { useState, type CSSProperties } from 'react'
import { applyArchetype, ARCHETYPE_LIST, type Archetype } from '@/planet/archetypes'
import { levaSync } from './levaSync'

/**
 * A CSS "planet disc" preview built from an archetype's palette: a lit sphere
 * (radial highlight + inset shading) with an atmosphere/ember glow. Crisp at any
 * size and needs no rendered assets, so each card stays in sync with the preset.
 */
function discStyle(a: Archetype): CSSProperties {
  const p = a.params
  const hi = p.highColor ?? '#cccccc'
  const mid = p.midColor ?? '#888888'
  const low = p.lowColor ?? '#222222'
  const volcanic = (p.emissiveStrength ?? 0) > 0
  const glow = volcanic ? p.emberColor ?? '#ff5a1e' : p.atmosphereColor ?? '#5b8cff'
  const hasGlow = volcanic || p.atmosphereEnabled !== false
  const inset = 'inset -8px -10px 22px rgba(0,0,0,0.55)'
  return {
    background: `radial-gradient(circle at 34% 30%, ${hi} 0%, ${mid} 42%, ${low} 82%)`,
    boxShadow: hasGlow ? `0 0 18px 1px ${glow}88, ${inset}` : inset,
  }
}

/**
 * Preset gallery: a toggleable overlay of the six archetypes. Clicking a card
 * applies that archetype (and its signature seed) and mirrors the change into the
 * leva panel via levaSync.
 */
export function Gallery() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="gallery-toggle" onClick={() => setOpen(true)}>
        ⊞ Presets
      </button>

      {open && (
        <div className="gallery-overlay" onClick={() => setOpen(false)}>
          <div className="gallery-panel" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-head">
              <span>Planet presets</span>
              <button className="gallery-close" onClick={() => setOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="gallery-grid">
              {ARCHETYPE_LIST.map((a) => (
                <button
                  key={a.id}
                  className="gallery-card"
                  onClick={() => {
                    levaSync.apply(applyArchetype(a.id))
                    setOpen(false)
                  }}
                >
                  <span className="gallery-thumb">
                    <span className="gallery-planet" style={discStyle(a)} />
                  </span>
                  <span className="gallery-card-title">{a.label}</span>
                  <span className="gallery-card-blurb">{a.blurb}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
