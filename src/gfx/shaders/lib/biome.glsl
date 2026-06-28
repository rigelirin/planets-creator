// =============================================================================
// biome.glsl — SINGLE SOURCE OF TRUTH for surface colour (albedo + roughness +
// emissive).
//
// #include'd by the live terrain fragment shader AND the export bake, so the
// downloaded GLB's albedo matches the live planet. Elevation ramp split at sea
// level + a latitude-driven ice cap + an optional volcanic molten-basin model.
// =============================================================================

#include ./noise.glsl;

// NOTE: uSeaLevel is declared in heightfield.glsl, which is always included before
// this file (terrain.csm.frag and bake.frag), so it is not redeclared here.
uniform vec3 uLowColor;    // deep ocean floor / lowest
uniform vec3 uShoreColor;  // shallows / coast
uniform vec3 uMidColor;    // vegetated land
uniform vec3 uHighColor;   // rock / snow peaks
uniform float uIceLatitude;
uniform vec3 uIceColor;
uniform float uCityLights;       // 0 = off, 1 = inhabited (night-side city glow)
uniform float uGaseous;          // 0 = terrestrial, 1 = banded gas giant

// Volcanic emissive. uEmissiveStrength == 0 leaves every non-volcanic world inert.
uniform float uLavaLevel;        // basins below this elevation turn molten
uniform vec3  uLavaColor;        // cooled basalt crust albedo
uniform vec3  uEmberColor;       // glowing fissures / molten pools
uniform float uEmissiveStrength; // emissive multiplier (Bloom feeds off this)

// Geography-based city-light emission (linear), independent of orientation so it
// bakes consistently. Warm clustered lights on habitable land: above the
// shoreline, off the high peaks, outside the ice cap. The live shader gates this
// to the night side; the export bakes it over all land (engine lighting reveals
// it). Returns 0 unless uCityLights is on.
vec3 cityLightEmissive(vec3 dir, float h, float latAbs) {
  if (uCityLights < 0.5 || h < uSeaLevel) return vec3(0.0);
  float lowland = smoothstep(uSeaLevel + 0.004, uSeaLevel + 0.05, h) * (1.0 - smoothstep(0.22, 0.42, h));
  float snowLine = uIceLatitude - max(0.0, h) * 0.25;
  float habitable = lowland * (1.0 - smoothstep(snowLine - 0.06, snowLine + 0.06, latAbs));
  float pop = smoothstep(0.16, 0.46, fbm(dir * 22.0, 4, 2.0, 0.5));
  float speckle = smoothstep(0.54, 0.82, fbm(dir * 78.0, 3, 2.0, 0.5) * 0.5 + 0.5);
  float lights = habitable * pop * speckle;
  return vec3(1.0, 0.78, 0.45) * lights * 2.2; // sodium-lamp amber, bloom-bright
}

/**
 * Banded gas-giant albedo: latitude zones drawn from the palette, churned by
 * turbulent zonal flow (warped latitude) with a great-spot storm. Uses the
 * heightfield uniforms (uSeedOffset / uBaseFrequency / uWarp), so the terrain
 * fragment includes heightfield too. Smooth shell — the archetype sets amplitude 0.
 */
vec3 gasGiantColor(vec3 dir) {
  float lat = asin(clamp(dir.y, -1.0, 1.0)) * 0.63662; // -1..1 (proper latitude)
  vec3 p = dir * uBaseFrequency + uSeedOffset;
  // Streaky zonal turbulence: stronger gradient across latitude than longitude.
  float flow = fbm(vec3(p.x * 0.5, p.y * 2.0, p.z * 0.5), 5, 2.0, 0.55);
  float wlat = lat + flow * uWarp * 0.22;
  float zone = sin(wlat * 24.0) * 0.5 + 0.5;            // alternating belts/zones
  float grad = wlat * 0.5 + 0.5;                         // pole -> pole gradient
  vec3 darkBand = mix(uLowColor, uMidColor, grad);      // belts
  vec3 lightBand = mix(uShoreColor, uHighColor, grad);  // zones
  vec3 col = mix(darkBand, lightBand, smoothstep(0.35, 0.65, zone));
  col *= 0.9 + 0.18 * fbm(p * 3.0, 3, 2.0, 0.5);         // fine turbulence
  // Great spot: an oval cyclone in the southern mid-latitudes.
  vec3 spot = normalize(vec3(0.62, -0.34, 0.71));
  vec2 d = vec2(distance(dir.xz, spot.xz) * 0.7, (dir.y - spot.y) * 1.6);
  float storm = smoothstep(0.42, 0.12, length(d));
  col = mix(col, mix(uMidColor, vec3(0.62, 0.22, 0.16), 0.7), storm * 0.85);
  return col;
}

/**
 * Surface albedo at signed elevation h, absolute latitude latAbs (0..1) and
 * unit-sphere direction dir. Writes roughness and emissive (linear).
 */
vec3 surfaceColor(float h, float latAbs, vec3 dir, out float roughness, out vec3 emissive) {
  emissive = vec3(0.0);
  if (uGaseous > 0.5) {
    roughness = 0.7;
    return gasGiantColor(dir);
  }
  vec3 col;
  if (h < uSeaLevel) {
    float t = smoothstep(uSeaLevel - 0.5, uSeaLevel, h);
    col = mix(uLowColor, uShoreColor, t);
    roughness = 0.4;
  } else {
    float t = smoothstep(uSeaLevel, uSeaLevel + 0.45, h);
    col = mix(uMidColor, uHighColor, t);
    roughness = 0.95;
  }

  // Polar ice; high peaks let the snow line creep toward the equator.
  float snowLine = uIceLatitude - max(0.0, h) * 0.25;
  float ice = smoothstep(snowLine - 0.06, snowLine + 0.06, latAbs);
  col = mix(col, uIceColor, ice);
  roughness = mix(roughness, 0.6, ice);

  // Molten basins (volcanic worlds): cooled crust laced with glowing fissures.
  // The fissure network is the zero-isoline of an fbm field — thin hot lines —
  // plus a solid molten pool at the deepest elevations.
  if (uEmissiveStrength > 0.0) {
    float basin = smoothstep(uLavaLevel, uLavaLevel - 0.22, h); // 0 at rim -> 1 deep
    if (basin > 0.0) {
      float f = fbm(dir * 8.0, 5, 2.1, 0.5);
      float fissure = smoothstep(0.06, 0.0, abs(f));               // thin glowing veins
      float pool = smoothstep(uLavaLevel - 0.08, uLavaLevel - 0.3, h); // deep molten pools
      float hot = clamp(max(fissure, pool) * basin, 0.0, 1.0);
      col = mix(col, uLavaColor, basin);                           // basalt crust
      col = mix(col, uEmberColor, hot);                            // glowing albedo
      roughness = mix(roughness, 0.55, basin);
      emissive = uEmberColor * hot * uEmissiveStrength;
    }
  }

  return col;
}
