// Live planetary ring shell. Reads the shared ring band pattern (lib/rings.glsl)
// from the world-space radius, lights it by the sun, and outputs LINEAR colour
// with Cassini gaps as transparency. Uses the shared shell.vert.glsl vertex stage.

#include ./lib/rings.glsl;

varying vec3 vWorldPos;

uniform vec3 uSunDir;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform vec3 uInnerColor;
uniform vec3 uOuterColor;
uniform float uOpacity;
uniform vec3 uSeed;

void main() {
  // The ring is centred on the origin and only rotated, so distance from the
  // centre is the radial band coordinate.
  float r = length(vWorldPos);
  float t = (r - uInnerRadius) / (uOuterRadius - uInnerRadius);
  vec4 ring = ringSample(t, uInnerColor, uOuterColor, uSeed);
  if (ring.a <= 0.002) discard;

  // Lit arc: brighter where the ring sits on the sun-facing side of the planet.
  float sunSide = 0.5 + 0.5 * dot(normalize(vWorldPos), normalize(uSunDir));
  float light = 0.4 + 0.7 * sunSide;

  gl_FragColor = vec4(ring.rgb * light, ring.a * uOpacity);
}
