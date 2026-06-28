// Atmosphere shell: a back-side fresnel rim glow, brighter on the day side and
// at the horizon. Additive blending + values that can exceed 1.0 feed Bloom.
// Output is LINEAR (composer handles tonemapping).

varying vec3 vDir;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;

uniform vec3 uSunDir;
uniform vec3 uColor;
uniform float uPower;   // rim falloff
uniform float uDensity; // overall strength

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uSunDir);

  // Rim: strongest where the view grazes the shell silhouette.
  float rim = pow(1.0 - abs(dot(N, V)), uPower);

  // Day side glows; night side keeps a faint halo.
  float day = smoothstep(-0.35, 0.5, dot(vDir, L));
  float intensity = rim * uDensity * (0.2 + 1.1 * day);

  gl_FragColor = vec4(uColor * intensity, intensity);
}
