// Export ring-bake pass. Draws the shared ring band pattern (lib/rings.glsl) into
// a SQUARE texture as concentric bands around the centre, so it maps correctly
// onto THREE.RingGeometry UVs (which centre the disc in UV space). RGB is the
// sRGB ring colour; alpha carries the Cassini-gap coverage. What you see is what
// you bake.

#include ./lib/rings.glsl;

varying vec2 vUv;

uniform float uInnerRadius;
uniform float uOuterRadius;
uniform vec3 uInnerColor;
uniform vec3 uOuterColor;
uniform vec3 uSeed;

vec3 linearToSRGB(vec3 c) {
  c = max(c, vec3(0.0));
  return mix(1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, c * 12.92, step(c, vec3(0.0031308)));
}

void main() {
  // RingGeometry UVs centre the disc: a texel at uv maps to position
  // (uv*2-1)*outerRadius in the ring plane, so radius = length(uv*2-1)*outerRadius.
  float r = length(vUv * 2.0 - 1.0) * uOuterRadius;
  float t = (r - uInnerRadius) / (uOuterRadius - uInnerRadius);
  vec4 ring = ringSample(t, uInnerColor, uOuterColor, uSeed);
  gl_FragColor = vec4(linearToSRGB(ring.rgb), ring.a);
}
