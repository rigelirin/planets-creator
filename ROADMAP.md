# Planets Creator — Roadmap

Browser-based procedural 3D planet generator (React + react-three-fiber + Vite + TS).
The single living status + roadmap doc. Architecture & features: see `OVERVIEW.md`.

Live: `npm run dev` → http://localhost:5173 · Build: `npm run build` · Tests: `npm test`

Legend: **[x]** done · **[ ]** not yet.

---

## ✅ Shipped

### Foundation
- [x] Vite + React + R3F + TypeScript; leva controls + zustand; store→uniform bridge
  (dragging a control mutates uniforms in place, never re-renders React).
- [x] Cube-sphere terrain; single-source `noise`/`heightfield`/`biome` GLSL `#include`d by
  both the live material (CSM over MeshStandard PBR) and the export bake (parity).
- [x] `mulberry32` deterministic seeds (same seed → same planet); latitude ice caps.
- [x] Ocean / cloud / atmosphere shells + bloom — the "Stellaris" look.

### Planet variety
- [x] **7 archetypes** — Continental, Ocean, Desert, Arctic, Volcanic, Barren, **Gas Giant**
  (banded `uGaseous` shader); dropdown + **preset gallery** (planet-disc previews).
- [x] Volcanic emissive molten basins; Barren crater field; `surfaceModel` discriminator.
- [x] **Randomize within archetype** (HSL colour + in-range jitter) + shape/palette/climate
  **lock groups**.
- [x] **URL-hash sharing** (exact state in `#p=…`) + **JSON preset** save/load.
- [x] Seeded **planet names** (`nameGen.ts`), shown in the UI + used for export filenames.

### Terrain realism
- [x] ★ **Realistic continents** — a continentality redistribution (low-freq field through a
  sigmoid → bimodal ocean-basin / continental-platform hypsometry) yields a few large
  **cohesive continents** + **grouped island arcs**; a land mask keeps mountains on land
  (no mid-ocean ridges); ~28% Earth-like land. New **Continents** + **Islands** sliders.

### Export & polish
- [x] GPU bake → full PBR map set: **albedo + normal + metallic-roughness + emissive**;
  **clouds as a separate transparent node**.
- [x] **Multi-format export**: GLB / glTF / STL (3D print) / OBJ / USDZ (AR), each lazy-loaded.
- [x] **Screenshot** (PNG of the live view); **night-side city lights** (live + baked).
- [x] Code-split export path; **error boundary + WebGL-2 fallback**; phone-collapsed controls.
- [x] **vitest** harness (serialize round-trip, seed/name determinism, archetypes, lock groups).

---

## 🚧 Next

- [ ] ★ **Planetary rings** — a tilted ring-plane node with a radial banded alpha texture
  (Cassini gaps), driven by the palette; exports as its own node; shines on the Gas Giant.

---

## 🔭 Roadmap (grouped)

**Planets & bodies**
- [ ] Moons & multi-body systems (each child its own mini-planet).
- [ ] More archetypes: Toxic, Gaia, Tomb/Dead, Tundra, Savanna (mostly data-only on the
  terrestrial shader).

**Terrain realism** (builds on the continent system)
- [ ] Hydraulic-erosion bake — optional CPU/worker pass on export for river valleys & fans.
- [ ] Rivers & lakes from flow accumulation.
- [ ] Biome maps — temperature × moisture → jungle / tundra / steppe colouring.

**Rendering**
- [ ] HDRI / image-based lighting.
- [ ] Realistic atmospheric scattering (Rayleigh/Mie).
- [ ] Aurora at the poles; ring shadows cast on the planet.

**Export & performance**
- [ ] Draco mesh + KTX2 texture compression (smaller GLB/USDZ).
- [ ] Worker-offloaded bake; preview-LOD while dragging structural params.

**UX**
- [ ] Full mobile layout (basic responsive collapse is in; touch + panel UX TBD).
- [ ] Real rendered gallery thumbnails (CSS planet-disc previews stand in for now).
- [ ] Undo / redo; saved-worlds gallery.
- [ ] Colour-ramp gradient editor (custom leva plugin, deferred).

---

## ⚠️ Caveats
- `.npmrc` sets `legacy-peer-deps=true` — required; without it npm's resolver hangs on
  this R3F + React-19 stack.
- The export bake is briefly synchronous (~1.2 s at Standard) until the worker offload.
- Chrome blocks *repeated* programmatic downloads (the first export always saves).
- **vite-plugin-glsl breaks on backticks in GLSL comments** — keep shader comments
  ASCII and backtick-free.
