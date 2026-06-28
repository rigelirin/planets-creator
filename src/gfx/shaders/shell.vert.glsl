// Shared vertex stage for the water / cloud / atmosphere shells (plain spheres).
// Exposes the object-space direction (for noise that rotates with the mesh) plus
// world-space normal & position (for fresnel / specular / rim lighting).

varying vec3 vDir;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;

void main() {
  vDir = normalize(position);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
