// =============================================================================
// heightfield.glsl -- the terrain shape, evaluated from a unit-sphere direction.
//
// SINGLE SOURCE OF TRUTH for elevation: #include'd by the live terrain vertex
// shader AND the export bake passes, so the baked mesh matches the live planet
// exactly. Uniform-driven: tweaking any value mutates a uniform and triggers NO
// shader recompile.
//
// Earth-like land: a low-frequency continent field is pushed through a sigmoid
// into a bimodal hypsometry (broad deep basins + broad low continental platforms
// + a defined coastal slope). A land mask gates all subaerial detail so mountains
// only appear on land, and an ocean-only island term adds margin-biased arcs.
// =============================================================================

#include ./noise.glsl;

uniform vec3  uSeedOffset;     // domain offset derived from the seed (determinism)
uniform float uBaseFrequency;  // continent scale: lower => fewer, larger continents
uniform int   uOctaves;        // DETAIL octaves (mountains/hills), not continents
uniform float uLacunarity;     // frequency multiplier per octave
uniform float uGain;           // amplitude multiplier per octave
uniform float uWarp;           // domain-warp strength (organic coastlines)
uniform float uRidgeMix;       // mountain amount on land
uniform float uCraterMix;      // 0 = none, 1 = crater field dominates (Barren/moon)
uniform float uCraterDensity;  // crater count (Worley cell frequency)
uniform float uSeaLevel;       // waterline: coastline sits at h = uSeaLevel
uniform float uContinents;     // 0..1 cohesion: many soft masses <-> few big continents
uniform float uIslands;        // 0..1 archipelago amount (ocean only)

// Odd, monotonic sigmoid on [-1, 1]: steep near 0, flat toward +/-1. Higher k
// gives a sharper coast and broader flat abyss/platform => more cohesive
// continents. (No tanh in GLSL ES 1.00, so this cubic stand-in is used.)
float continentality(float c, float k) {
  float x = clamp(c * k, -1.0, 1.0);
  return x * (1.5 - 0.5 * x * x);
}

/**
 * Signed elevation at a unit-sphere direction, roughly in [-1, 1]. The coastline
 * sits at h = uSeaLevel (where the biome ramp and the water shell also split);
 * oceans are below it, continents above. Amplitude is applied by the caller, so
 * this stays a pure shape function.
 */
float terrainHeight(vec3 dir) {
  vec3 cp = dir * uBaseFrequency + uSeedOffset;

  // 1) CONTINENTS: low-frequency, domain-warped, FIXED 4 octaves (decoupled from
  //    uOctaves so raising detail never shatters coastlines). uBaseFrequency sets
  //    the continent scale, so a low value gives a few big cohesive masses.
  vec3 wcp = domainWarp(cp, uWarp);
  float cont = fbm(wcp, 4, uLacunarity, uGain);   // ~[-1, 1]
  float c = cont - uSeaLevel;                      // coastline at c = 0

  // 2) HYPSOMETRY: bimodal. Oceans drop fast and deep (x0.5); land is a LOW shelf
  //    (x0.10) so flat interiors read as the mid (vegetated) colour, with peaks
  //    rising above. Matches the biome elevation ramp.
  float k    = mix(1.3, 3.6, uContinents);
  float s    = continentality(c, k);
  float base = uSeaLevel + min(s, 0.0) * 0.5 + max(s, 0.0) * 0.10;

  // 3) LAND MASK: gates every subaerial term -- this is what keeps ridges out of
  //    the open ocean. Crisper coasts at higher cohesion.
  float coastW = mix(0.16, 0.05, uContinents);
  float m = smoothstep(0.0, coastW, c);            // 0 ocean -> 1 inland

  // 4) DETAIL on land: orogenic belts (ridged, masked by a low-freq belt field so
  //    land is not uniformly mountainous) + rolling hills.
  float belt  = smoothstep(0.45, 0.78, fbm(cp * 1.7 + vec3(31.7), 3, 2.0, 0.5) * 0.5 + 0.5);
  float mtn   = ridged(cp * 3.3, uOctaves, uLacunarity, uGain);
  mtn *= mtn;                                      // sharpen ridgelines
  float hills = fbm(cp * 5.0 + vec3(11.3), uOctaves, uLacunarity, uGain);
  float h = base + m * (hills * 0.05 + uRidgeMix * mtn * mix(0.20, 0.85, belt) * 0.55);

  // 5) OCEAN: subtle abyssal-plain variation so deep sea is not a dead-flat shell.
  h += (1.0 - m) * snoise(cp * 2.3) * 0.015;

  // 6) ISLANDS: arcs near continental margins + sparse grouped clusters, ocean
  //    only, so they never speckle the land. Margin-biased -- shallow shelves
  //    breach easily, deep ocean stays mostly open.
  if (uIslands > 0.0) {
    float arcs     = ridged(cp * 6.0, 5, 2.1, 0.5);             // peaky chains
    float clusters = smoothstep(0.15, 0.55, snoise(cp * 3.5));  // grouped, not uniform
    float margin   = smoothstep(-0.22, 0.0, c);                 // offshore -> deep
    h += uIslands * arcs * clusters * (1.0 - m) * mix(0.18, 1.0, margin) * 0.5;
  }

  // 7) CRATERS: airless/Barren path, unchanged. Dominates when mixed in.
  if (uCraterMix > 0.0) {
    float craters = craterField(dir * uCraterDensity + uSeedOffset, 1.0, 0.55);
    h = mix(h, craters, uCraterMix);
  }

  return h;
}
