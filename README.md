# Planets Creator

Generate, fine-tune, and export stylized 3D planets in your browser. Pick a
Stellaris-style archetype, tweak it live, re-roll variations from a seed, share a
planet as a URL, and export a textured model for Blender, game engines, or AR.

Built with React, react-three-fiber, and WebGL2.

## Features

- **Seven archetypes** — Continental, Ocean, Desert, Arctic, Volcanic, Barren, and a
  banded Gas Giant. Choose from a dropdown or the visual preset gallery.
- **Realistic land** — continents form as cohesive landmasses with grouped island
  arcs and coastal mountains (not random noise), at an Earth-like land/sea ratio.
- **Living look** — animated oceans, clouds, an atmosphere rim, polar ice, volcanic
  lava glow, night-side city lights, and a Saturn-like ring system with Cassini gaps.
- **Deterministic seeds** — the same seed always rebuilds the same planet, and every
  world gets a generated name.
- **Randomize with locks** — re-roll within an archetype, locking shape, palette, or
  climate to keep what you like.
- **Share & presets** — copy a URL that reproduces the exact planet, or save and load
  JSON presets.
- **Model export** — a real displaced mesh with PBR textures (albedo, normal,
  metallic-roughness, emissive) as GLB / glTF / USDZ, or geometry-only STL / OBJ.

## Quick start

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production build
npm test           # vitest unit tests
npm run preview    # serve the production build
```

## How it works

The live planet is rendered entirely by GPU shaders for instant editing. The same
GLSL (noise, heightfield, biome, rings) is shared by the live material and the
export bake, so what you see is what you download. A `mulberry32` seed drives a
deterministic noise offset, and a zustand store mutates shader uniforms in place so
dragging a control never re-renders React.

Export bakes the procedural surface into a displaced mesh plus equirectangular PBR
textures, then writes the model through three.js exporters; clouds and rings export
as their own transparent nodes.

See [OVERVIEW.md](OVERVIEW.md) for the architecture and [ROADMAP.md](ROADMAP.md) for
status and plans.

## Tech stack

React 19 · react-three-fiber + drei · three.js · @react-three/postprocessing ·
zustand · leva · Vite · TypeScript · vitest.
