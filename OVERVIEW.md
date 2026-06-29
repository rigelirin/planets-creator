# Planets Creator — Overview

A browser tool for generating, fine-tuning, and exporting stylized 3D planets.
Pick a Stellaris-style archetype, tune it live, re-roll variations from a seed,
share a planet as a URL, and export a textured **GLB** for Blender / game engines.

Stack: **React + react-three-fiber + drei**, **Vite**, **TypeScript**, **zustand**
state, **leva** controls, **@react-three/postprocessing** (bloom). WebGL2.

- Dev: `npm run dev` → http://localhost:5173
- Typecheck / build: `npm run build` (`tsc -b && vite build`)
- Tests: `npm test` (vitest) — serialization round-trip, seed determinism, archetype
  application, and randomize lock groups
- `.npmrc` sets `legacy-peer-deps=true` — required; without it npm's resolver
  hangs on the R3F + React 19 stack.

---

## Architecture

### Live / export parity (the load-bearing idea)
The live planet is rendered by GPU shaders for instant editing; **export bakes**
a real displaced mesh + equirectangular PBR textures and writes a GLB via Three's
`GLTFExporter`. Both paths read the **same GLSL**, so what you see is what you bake.

- The terrain material is **`three-custom-shader-material`** wrapping
  `MeshStandardMaterial` — our GLSL is injected into the vertex (position/normal)
  and fragment (diffuse/roughness/emissive) stages while Three's standard PBR
  lighting, tone mapping and bloom run unchanged. The live and baked planets light
  identically.
- `src/gfx/shaders/lib/{noise,heightfield,biome}.glsl` are the **single source of
  truth**, `#include`d (via `vite-plugin-glsl`) by *both* the live material and the
  bake passes.

### Determinism
`seed → mulberry32 (xmur3 for string seeds) → a domain offset` → identical
landmass every time, on every machine (CPU math). `Math.random` is used only to
mint a new seed. The full planet = `seed + params`; the exact state is captured in
the share URL (see Sharing), so a refresh or pasted link reproduces it precisely.

### State → uniforms without re-renders
The zustand store (`src/state/usePlanetStore.ts`) is the single source of truth.
Scene components subscribe imperatively and mutate shader `uniform.value` in place
(`src/state/uniformsBridge.ts`), so dragging a control never re-renders React.
leva's transient `onChange` writes the store; programmatic changes (archetype /
randomize / share-load) write the store and then mirror back into leva via its
`set()`.

### Rendering
- **Geometry:** live = cube-sphere (6 warped faces, analytic spherify, outward
  winding); export = UV-sphere with equirectangular UVs.
- **Terrain:** a low-frequency continent field pushed through a *continentality*
  sigmoid → **cohesive continents + grouped island arcs** (a land mask keeps
  mountains on land, never mid-ocean), tuned by **Continents**/**Islands** sliders;
  optional Worley **crater field** (barren). Elevation/latitude **biome** ramp:
  sea-level split, polar ice caps, an emissive **molten-basin** model for volcanic
  worlds, and a banded path for gas giants.
- **Shells** (toggleable): ocean (fresnel + sun specular + day/night terminator),
  clouds (animated fbm coverage), atmosphere (back-side fresnel rim).
- **Post:** renderer `NoToneMapping` + `EffectComposer` Bloom + ACES `ToneMapping`,
  so PBR terrain and the raw-ShaderMaterial shells tone-map identically.

### Export bake → GLB
`src/export/bakePlanet.ts`: GPU passes over an equirectangular grid reuse the
shared GLSL to bake a full PBR texture set — **albedo** (sRGB), **height** (float),
tangent-space **normal**, **metallic-roughness** (glTF G=roughness/B=metalness) and,
for volcanic worlds, **emissive** (sRGB). Readback → a displaced UV-sphere mesh
(bilinear height sample, outward winding) carrying smooth **radial** normals, so the
baked normal map (its east/north/radial frame matches the mesh's UV-derived tangent
frame) supplies all surface relief without double-counting. Textures →
`MeshStandardMaterial` → binary GLB via `GLTFExporter`. Resolution presets: Preview /
Standard / High. The bake + exporter are lazily imported in `runExport`, so they
stay out of the initial bundle (separate `bakePlanet` / `exportGLB` chunks).

When clouds are enabled they export as a **second, transparent node** — a shell at
`CLOUD_RADIUS_FACTOR` whose baseColor-alpha texture is a static cloud-coverage bake
(the shared `lib/clouds.glsl`), so the layer can be toggled or removed downstream.

A **Screenshot** button (`src/export/screenshot.ts`) saves a PNG of the live view
(bloom + tone mapping included) straight from the canvas — the renderer runs with
`preserveDrawingBuffer`.

### Sharing & presets
`src/planet/serialize.ts`: params ⇄ versioned base64url. The current planet is
written to the URL hash (`#p=…`, debounced) and restored on load; **Copy link**,
**Save preset (.json)** and **Load preset (.json)** reuse the same codec.

---

## Product features

- **Seven archetypes** (`src/planet/archetypes.ts`): Continental, Ocean, Desert,
  Arctic, Volcanic, Barren, and **Gas Giant** — each a curated parameter set +
  signature seed. The `surfaceModel` discriminator (`terrestrial | gaseous`) drives
  the banded gas-giant look (a `uGaseous` branch in the shared shader, so it bakes
  too). Pick from the dropdown or the **preset gallery** (`src/ui/Gallery.tsx`), an
  overlay of palette-driven planet-disc previews.
- **Live tuning** of terrain shape, elevation palette, climate (ice line), volcanic
  glow, night-side **city lights**, the ocean / cloud / atmosphere shells, and a
  Saturn-like **ring system** (banded, tilted, with Cassini gaps).
- **Seeded regeneration** — type or randomize a seed for a new world, each with a
  deterministic generated **name** (`src/planet/nameGen.ts`) used in export filenames.
- **Randomize with locks** (`src/planet/randomize.ts`): re-roll within the current
  archetype, jittering colours in HSL and scalars in range so results stay
  coherent. Lock **shape**, **palette**, or **climate** to hold that group fixed
  (e.g. same landmass, new colours).
- **Share / presets** — copy a URL that reproduces the exact planet; save/load
  JSON presets.
- **Model export** — textured PBR planet (albedo + normal + metallic-roughness +
  emissive) as **GLB / glTF / USDZ** (AR), or geometry-only **STL** (3D print) /
  **OBJ**; volcanic worlds keep their glow, and clouds + rings export as separate
  transparent nodes.
- **Screenshot** — save a PNG of the current view.
- **Graceful fallbacks** — a WebGL-2 capability check and a render error boundary
  (`src/ui/ErrorBoundary.tsx`) instead of a blank screen; controls collapse on phones.

---

## Directory map

```
src/
  scene/      PlanetCanvas, TerrainSphere, Water/Cloud/Atmosphere shells, CaptureRenderer
  gfx/
    materials/  createTerrainMaterial (CSM) + water/cloud/atmosphere materials
    shaders/    lib/{noise,heightfield,biome}.glsl · terrain.csm.{vert,frag} · bake.{vert,frag}
    geometry/   cubeSphere.ts (live)
  planet/     archetypes.ts (registry) · randomize.ts · serialize.ts · seed.ts
  rng/        mulberry32.ts (+ xmur3 string seeds)
  state/      usePlanetStore.ts · uniformsBridge.ts
  export/     bakePlanet.ts · exportGLB.ts · runExport.ts · exportApi.ts · useExportStore.ts
  ui/         ControlPanel.tsx · ExportOverlay.tsx
  lib/        download.ts
```

See `ROADMAP.md` for shipped status and the roadmap.
The colour-ramp gradient editor is deferred — the per-archetype 4-stop palette plus
HSL randomize covers v1; a draggable N-stop editor would need a custom leva plugin
and a biome ramp-texture refactor (tracked for a follow-up).
