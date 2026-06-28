// Export bake pass. For each equirectangular texel: reconstruct the sphere
// direction, evaluate the SAME heightfield + biome GLSL the live planet uses,
// and write albedo / height / tangent-space normal depending on uBakeMode.
// What you see is what you bake.

#include ./lib/heightfield.glsl;
#include ./lib/biome.glsl;

varying vec2 vUv;

uniform int uBakeMode;    // 0 albedo(sRGB) · 1 height(float) · 2 normal · 3 emissive(sRGB) · 4 metalRough
uniform float uAmplitude; // displacement, for the normal/height passes
uniform vec2 uTexel;      // 1 / resolution, for finite differences

const float BPI = 3.141592653589793;

vec3 dirFromUv(vec2 uv) {
  float lon = (uv.x * 2.0 - 1.0) * BPI; // -PI .. PI
  float lat = (uv.y - 0.5) * BPI;       // -PI/2 .. PI/2
  float cl = cos(lat);
  return vec3(cl * sin(lon), sin(lat), cl * cos(lon));
}

vec3 linearToSRGB(vec3 c) {
  c = max(c, vec3(0.0));
  return mix(1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, c * 12.92, step(c, vec3(0.0031308)));
}

void main() {
  vec3 dir = dirFromUv(vUv);
  float h = terrainHeight(dir);

  if (uBakeMode == 0) {
    float rough;
    vec3 emis;
    vec3 col = surfaceColor(h, abs(dir.y), dir, rough, emis);
    gl_FragColor = vec4(linearToSRGB(col), 1.0); // sRGB-encoded for the glTF baseColor texture
  } else if (uBakeMode == 1) {
    gl_FragColor = vec4(h, h, h, 1.0);           // raw signed height (float target)
  } else if (uBakeMode == 3) {
    float rough;
    vec3 emis;
    surfaceColor(h, abs(dir.y), dir, rough, emis);
    emis += cityLightEmissive(dir, h, abs(dir.y)); // baked over all land; engine lights the night side
    gl_FragColor = vec4(linearToSRGB(clamp(emis, 0.0, 1.0)), 1.0); // sRGB emissive map
  } else if (uBakeMode == 4) {
    float rough;
    vec3 emis;
    surfaceColor(h, abs(dir.y), dir, rough, emis);
    gl_FragColor = vec4(1.0, rough, 0.0, 1.0);   // glTF metallic-roughness: G=rough, B=metal=0
  } else {
    // Tangent-space normal from the displaced height field (finite differences).
    vec3 dU = dirFromUv(vUv + vec2(uTexel.x, 0.0));
    vec3 dV = dirFromUv(vUv + vec2(0.0, uTexel.y));
    float hU = terrainHeight(dU);
    float hV = terrainHeight(dV);
    vec3 p = dir * (1.0 + h * uAmplitude);
    vec3 pu = dU * (1.0 + hU * uAmplitude);
    vec3 pv = dV * (1.0 + hV * uAmplitude);
    vec3 nrm = normalize(cross(pu - p, pv - p));
    if (dot(nrm, dir) < 0.0) nrm = -nrm;

    vec3 T = normalize(cross(vec3(0.0, 1.0, 0.0), dir)); // east
    vec3 B = cross(dir, T);                              // north
    vec3 nt = vec3(dot(nrm, T), dot(nrm, B), dot(nrm, dir));
    gl_FragColor = vec4(nt * 0.5 + 0.5, 1.0);
  }
}
