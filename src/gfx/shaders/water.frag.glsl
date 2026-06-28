// Ocean shell: fresnel-tinted water with a sun specular glint and a subtle
// noise-broken highlight. Output is LINEAR (the EffectComposer ToneMapping pass
// handles tonemapping + sRGB for the whole scene uniformly).

#include ./lib/noise.glsl;

varying vec3 vDir;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;

uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform float uOpacity;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uSunDir);

  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 140.0);
  spec *= 0.5 + 0.5 * (fbm(vDir * 26.0 + vec3(uTime * 0.08, 0.0, 0.0), 2, 2.0, 0.5) * 0.5 + 0.5);

  float day = smoothstep(-0.15, 0.3, dot(N, L));

  vec3 col = mix(uDeepColor, uShallowColor, fres);
  col = col * day + uSunColor * spec * day * 1.6;

  float alpha = mix(uOpacity, 1.0, fres);
  gl_FragColor = vec4(col, alpha);
}
