// =============================================================================
// rings.glsl -- SINGLE SOURCE OF TRUTH for the planetary ring band pattern.
//
// #include'd by the live ring fragment shader AND the export ring-bake pass, so
// the baked ring texture matches the live ring. t is the normalized radial
// coordinate across the ring (0 = inner edge, 1 = outer edge). Returns linear RGB
// plus coverage in alpha (Cassini-style gaps drop alpha to 0). Outside [0,1] the
// coverage is 0 so the bake's square texture margins stay transparent.
// =============================================================================

float ringHash(float x) {
  return fract(sin(x * 91.37 + 13.71) * 43758.5453);
}

vec4 ringSample(float t, vec3 innerColor, vec3 outerColor, vec3 seed) {
  if (t < 0.0 || t > 1.0) return vec4(0.0);
  float s = seed.x * 2.3 + seed.y * 1.1 + seed.z * 0.7;   // per-seed phase

  // Many fine concentric bands plus a slower brightness undulation.
  float fine  = 0.5 + 0.5 * sin(t * 230.0 + s * 3.0);
  float broad = 0.5 + 0.5 * sin(t * 26.0 + s);
  float bright = 0.62 + 0.30 * broad + 0.18 * fine;

  // Colour: inner-to-outer gradient modulated by band brightness.
  vec3 col = mix(innerColor, outerColor, t) * bright;

  // Coverage: bands vary in density.
  float density = (0.55 + 0.40 * broad) * (0.65 + 0.35 * fine);

  // Cassini-style divisions: sharp transparent gaps at a few seed-shifted radii.
  float g1 = 0.40 + 0.06 * ringHash(s + 1.0);
  float g2 = 0.66 + 0.06 * ringHash(s + 2.0);
  float g3 = 0.24 + 0.05 * ringHash(s + 3.0);
  float gap = smoothstep(0.012, 0.045, abs(t - g1))
            * smoothstep(0.008, 0.030, abs(t - g2))
            * smoothstep(0.006, 0.025, abs(t - g3));

  // Soft inner and outer edges so the ring fades rather than hard-cutting.
  float edge = smoothstep(0.0, 0.04, t) * smoothstep(1.0, 0.95, t);

  return vec4(col, clamp(density, 0.0, 1.0) * gap * edge);
}
