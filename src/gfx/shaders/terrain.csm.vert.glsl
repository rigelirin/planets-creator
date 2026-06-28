// Terrain vertex stage (three-custom-shader-material).
// Displaces the cube-sphere along its direction by the heightfield, and computes
// an analytic normal from neighbouring height samples. Writes csm_Position /
// csm_Normal; Three's MeshStandard lighting then runs unchanged.

#include ./lib/heightfield.glsl;

uniform float uAmplitude;   // displacement height (fraction of radius)
uniform vec3 uSunDir;       // sun direction in world space (for the night side)

varying float vHeight;
varying vec3 vDir;
varying float vNight;       // 0 on the lit side, 1 deep on the night side

vec3 displaceDir(vec3 d, out float h) {
  h = terrainHeight(d);
  return d * (1.0 + h * uAmplitude);
}

void main() {
  vec3 dir = normalize(position);
  float h;
  vec3 displaced = displaceDir(dir, h);

  // Analytic normal: displace two tangent neighbours and cross the edges.
  vec3 ref = abs(dir.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(ref, dir));
  vec3 bitangent = cross(dir, tangent);
  const float eps = 0.0015;
  float hu, hv;
  vec3 pu = displaceDir(normalize(dir + tangent * eps), hu);
  vec3 pv = displaceDir(normalize(dir + bitangent * eps), hv);
  vec3 n = normalize(cross(pu - displaced, pv - displaced));
  if (dot(n, dir) < 0.0) n = -n; // keep outward-facing

  csm_Position = displaced;
  csm_Normal = n;

  vHeight = h;
  vDir = dir;
  // Day/night from the macro sphere direction in world space (planet rotates,
  // sun is fixed), so city lights only switch on as land turns away from the sun.
  vec3 worldDir = normalize(mat3(modelMatrix) * dir);
  vNight = smoothstep(-0.05, 0.3, -dot(worldDir, normalize(uSunDir)));
}
