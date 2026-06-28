// Export cloud-bake pass. For each equirectangular texel, evaluate the SAME
// cloud coverage GLSL the live shell uses (at t = 0, a static frame) and write it
// into the ALPHA channel of a white texel — so the exported cloud node's
// baseColor texture carries the coverage as transparency. RGB stays white; the
// cloud tint comes from the material's baseColor factor.

#include ./lib/clouds.glsl;

varying vec2 vUv;

uniform float uScale;
uniform float uCoverage;

const float BPI = 3.141592653589793;

vec3 dirFromUv(vec2 uv) {
  float lon = (uv.x * 2.0 - 1.0) * BPI; // -PI .. PI
  float lat = (uv.y - 0.5) * BPI;       // -PI/2 .. PI/2
  float cl = cos(lat);
  return vec3(cl * sin(lon), sin(lat), cl * cos(lon));
}

void main() {
  vec3 dir = dirFromUv(vUv);
  float cov = cloudCoverage(dir, uScale, uCoverage, 0.0, 0.0);
  gl_FragColor = vec4(1.0, 1.0, 1.0, cov);
}
