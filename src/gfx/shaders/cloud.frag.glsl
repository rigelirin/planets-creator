// Cloud shell: fbm coverage in object space (rotates with the mesh) with a slow
// time drift, lit by the sun (dark on the night side). Output is LINEAR. The
// coverage math lives in lib/clouds.glsl so the export bake matches exactly.

#include ./lib/clouds.glsl;

varying vec3 vDir;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;

uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uColor;
uniform float uCoverage; // 0 = clear, 1 = overcast
uniform float uOpacity;
uniform float uScale;
uniform float uSpeed;

void main() {
  float cov = cloudCoverage(vDir, uScale, uCoverage, uTime, uSpeed);
  if (cov <= 0.001) discard;

  vec3 N = normalize(vWorldNormal);
  float day = smoothstep(-0.1, 0.35, dot(N, normalize(uSunDir)));
  vec3 col = uColor * (0.22 + 0.95 * day);

  gl_FragColor = vec4(col, cov * uOpacity);
}
