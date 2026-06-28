// Fullscreen pass for the export bake: a 2x2 clip-space quad, passing UV through.
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
