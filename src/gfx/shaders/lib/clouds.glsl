// =============================================================================
// clouds.glsl — SINGLE SOURCE OF TRUTH for cloud coverage.
//
// #include'd by the live cloud shell AND the export cloud-bake pass, so the
// baked cloud layer matches the live one. Returns a soft 0..1 coverage mask.
// =============================================================================

#include ./noise.glsl;

/**
 * Cloud coverage at object-space direction dir. time/speed drift the field
 * (pass 0 for a static bake). fbm clusters near 0.5, so coverage maps to a moving
 * threshold with a soft band for wispy edges.
 */
float cloudCoverage(vec3 dir, float scale, float coverage, float time, float speed) {
  vec3 p = dir * scale + vec3(time * speed, time * speed * 0.3, 0.0);
  float n = fbm(p, 5, 2.0, 0.5) * 0.5 + 0.5; // [0, 1]
  float threshold = mix(0.72, 0.30, coverage);
  return smoothstep(threshold, threshold + 0.16, n);
}
