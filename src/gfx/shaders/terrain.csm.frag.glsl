// Terrain fragment stage (three-custom-shader-material).
// Delegates colour to the shared biome model so the live planet and the baked
// GLB are identical. Colours are linear-space uniforms; the EffectComposer
// ToneMapping pass handles tonemapping + sRGB for the whole scene.

// heightfield first: gas-giant colour reuses its domain uniforms (seed/freq/warp).
#include ./lib/heightfield.glsl;
#include ./lib/biome.glsl;

varying float vHeight;
varying vec3 vDir;
varying float vNight;

void main() {
  float roughness;
  vec3 emissive;
  vec3 col = surfaceColor(vHeight, abs(vDir.y), vDir, roughness, emissive);
  // City lights only on the night side (live); the bake emits them over all land.
  emissive += cityLightEmissive(vDir, vHeight, abs(vDir.y)) * vNight;
  csm_DiffuseColor = vec4(col, 1.0);
  csm_Roughness = roughness;
  csm_Emissive = emissive;
}
