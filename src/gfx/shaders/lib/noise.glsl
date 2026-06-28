// =============================================================================
// noise.glsl — SINGLE SOURCE OF TRUTH for all procedural noise.
//
// #include'd by both the live terrain material AND the export bake passes, so
// "what you see is what you bake". GLSL ES 1.00 compatible (works inside Three's
// MeshStandard shader program via three-custom-shader-material). All loops use a
// compile-time max bound + early break so they compile on every driver.
// =============================================================================

// --- 3D Simplex noise (Ashima / Stefan Gustavson, public domain) -------------
// Helpers prefixed n_ to avoid colliding with Three's shader chunks.

vec3 n_mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 n_mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 n_permute(vec4 x) { return n_mod289(((x * 34.0) + 1.0) * x); }
vec4 n_taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

/** Simplex noise in [-1, 1]. */
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = n_mod289(i);
  vec4 p = n_permute(n_permute(n_permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = n_taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// --- Fractal variants --------------------------------------------------------
// octaves is clamped to [0, N_MAX_OCTAVES] by the early break.

const int N_MAX_OCTAVES = 8;

/** Standard fractal Brownian motion, output roughly in [-1, 1]. */
float fbm(vec3 p, int octaves, float lacunarity, float gain) {
  float sum = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  float norm = 0.0;
  for (int i = 0; i < N_MAX_OCTAVES; i++) {
    if (i >= octaves) break;
    sum += amp * snoise(p * freq);
    norm += amp;
    freq *= lacunarity;
    amp *= gain;
  }
  return norm > 0.0 ? sum / norm : 0.0;
}

/** Ridged multifractal — sharp mountain ridges. Output roughly in [0, 1]. */
float ridged(vec3 p, int octaves, float lacunarity, float gain) {
  float sum = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  float prev = 1.0;
  float norm = 0.0;
  for (int i = 0; i < N_MAX_OCTAVES; i++) {
    if (i >= octaves) break;
    float n = 1.0 - abs(snoise(p * freq));
    n *= n;
    n *= prev;
    prev = n;
    sum += amp * n;
    norm += amp;
    freq *= lacunarity;
    amp *= gain;
  }
  return norm > 0.0 ? sum / norm : 0.0;
}

/** Billowy noise — rounded hills / puffy clouds. Output roughly in [-1, 1]. */
float billow(vec3 p, int octaves, float lacunarity, float gain) {
  float sum = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  float norm = 0.0;
  for (int i = 0; i < N_MAX_OCTAVES; i++) {
    if (i >= octaves) break;
    sum += amp * (abs(snoise(p * freq)) * 2.0 - 1.0);
    norm += amp;
    freq *= lacunarity;
    amp *= gain;
  }
  return norm > 0.0 ? sum / norm : 0.0;
}

/** Domain warp — displaces the sample point for organic, swirly continents. */
vec3 domainWarp(vec3 p, float strength) {
  vec3 q = vec3(
    snoise(p),
    snoise(p + vec3(5.2, 1.3, 2.7)),
    snoise(p + vec3(2.8, 4.1, 6.3))
  );
  return p + q * strength;
}

// --- Cellular (Worley) for crater fields ------------------------------------

vec3 n_hash3(vec3 c) {
  return fract(sin(vec3(
    dot(c, vec3(127.1, 311.7, 74.7)),
    dot(c, vec3(269.5, 183.3, 246.1)),
    dot(c, vec3(113.5, 271.9, 124.6))
  )) * 43758.5453);
}

/** Worley F1 distance (nearest feature point). Output roughly in [0, 1]. */
float worleyF1(vec3 p) {
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float d = 1.0;
  for (int x = -1; x <= 1; x++)
  for (int y = -1; y <= 1; y++)
  for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 o = n_hash3(ip + g);
    vec3 r = g + o - fp;
    d = min(d, dot(r, r));
  }
  return sqrt(d);
}

/**
 * Crater field for Barren / moon worlds: circular bowls with raised rims.
 * density scales crater count; rim controls rim height. Output centered ~0.
 */
float craterField(vec3 p, float density, float rim) {
  float w = worleyF1(p * density);
  float bowl = smoothstep(0.0, 0.32, w) - 1.0;        // -1 at center -> 0 outward
  float ring = rim * exp(-pow((w - 0.32) * 7.0, 2.0)); // gaussian rim ridge
  return bowl * 0.5 + ring;
}
