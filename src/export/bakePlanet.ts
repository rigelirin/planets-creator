import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  FloatType,
  Mesh,
  MeshStandardMaterial,
  NoColorSpace,
  PlaneGeometry,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  UnsignedByteType,
  Vector2,
  WebGLRenderTarget,
  type WebGLRenderer,
} from 'three'
import bakeVert from '@/gfx/shaders/bake.vert.glsl'
import bakeFrag from '@/gfx/shaders/bake.frag.glsl'
import cloudBakeFrag from '@/gfx/shaders/cloudBake.frag.glsl'
import { createTerrainUniforms } from '@/gfx/materials/createTerrainMaterial'
import { applyTerrainParams } from '@/state/uniformsBridge'
import type { PlanetParams } from '@/state/usePlanetStore'
import { BASE_RADIUS, CLOUD_RADIUS_FACTOR, CLOUD_SCALE } from '@/constants'

export type BakeResolution = { texW: number; texH: number; rings: number; segments: number }

export const BAKE_PRESETS: Record<string, BakeResolution> = {
  Preview: { texW: 1024, texH: 512, rings: 128, segments: 256 },
  Standard: { texW: 2048, texH: 1024, rings: 256, segments: 512 },
  High: { texW: 4096, texH: 2048, rings: 512, segments: 1024 },
}

/**
 * Bake the current planet into a real displaced mesh + a full PBR texture set
 * (albedo / normal / metallic-roughness / emissive) by running the shared
 * heightfield/biome GLSL over an equirectangular grid on the GPU, then reading it
 * back. Returns a Mesh ready for GLTFExporter. What you see is what you bake.
 *
 * The mesh carries smooth radial normals; all surface-relief shading comes from
 * the baked tangent-space normal map (its frame — east / north / radial — matches
 * the mesh's UV-derived tangent frame), so detail isn't double-counted and the
 * mesh density can stay modest.
 */
export function bakePlanetMesh(
  renderer: WebGLRenderer,
  params: PlanetParams,
  res: BakeResolution,
): Mesh {
  const { texW, texH, rings, segments } = res

  // Bake material reuses the SAME uniforms (and thus GLSL) as the live planet.
  const uniforms = {
    ...createTerrainUniforms(),
    uBakeMode: { value: 0 },
    uTexel: { value: new Vector2(1 / texW, 1 / texH) },
  }
  applyTerrainParams(uniforms as never, params)

  const mat = new ShaderMaterial({ vertexShader: bakeVert, fragmentShader: bakeFrag, uniforms })
  const quad = new Mesh(new PlaneGeometry(2, 2), mat)
  const scene = new Scene()
  scene.add(quad)
  const cam = new Camera()

  const prevTarget = renderer.getRenderTarget()

  // Render one equirectangular pass and read it back. Float for the height pass
  // (avoids banding); RGBA8 for the texture passes.
  const renderPass = (mode: number, float: boolean): Float32Array | Uint8Array => {
    const rt = new WebGLRenderTarget(texW, texH, {
      format: RGBAFormat,
      type: float ? FloatType : UnsignedByteType,
      depthBuffer: false,
    })
    uniforms.uBakeMode.value = mode
    renderer.setRenderTarget(rt)
    renderer.render(scene, cam)
    const buf = float ? new Float32Array(texW * texH * 4) : new Uint8Array(texW * texH * 4)
    renderer.readRenderTargetPixels(rt, 0, 0, texW, texH, buf)
    rt.dispose()
    return buf
  }

  const albedoBuf = renderPass(0, false) as Uint8Array
  const heightBuf = renderPass(1, true) as Float32Array
  const normalBuf = renderPass(2, false) as Uint8Array
  const mrBuf = renderPass(4, false) as Uint8Array
  const hasEmissive = params.emissiveStrength > 0 || params.cityLights
  const emisBuf = hasEmissive ? (renderPass(3, false) as Uint8Array) : null

  renderer.setRenderTarget(prevTarget)

  const geometry = buildDisplacedSphere(heightBuf, texW, texH, rings, segments, BASE_RADIUS, params.amplitude)

  const albedoTex = bufferToCanvasTexture(albedoBuf, texW, texH, SRGBColorSpace)
  const normalTex = bufferToCanvasTexture(normalBuf, texW, texH, NoColorSpace)
  const mrTex = bufferToCanvasTexture(mrBuf, texW, texH, NoColorSpace)

  const material = new MeshStandardMaterial({
    map: albedoTex,
    normalMap: normalTex,
    roughnessMap: mrTex, // samples .g
    metalnessMap: mrTex, // samples .b (= 0)
    roughness: 1.0,
    metalness: 1.0,
  })
  material.normalScale.set(1, 1)

  if (emisBuf) {
    const emisTex = bufferToCanvasTexture(emisBuf, texW, texH, SRGBColorSpace)
    material.emissive = new Color(0xffffff)
    material.emissiveMap = emisTex
    material.emissiveIntensity = 1.0
  }

  // Free bake-only GPU resources.
  mat.dispose()
  quad.geometry.dispose()

  const mesh = new Mesh(geometry, material)
  mesh.name = `planet-${params.seed || 'seed'}`
  return mesh
}

/** Cloud bake resolution (fixed; a smooth shell doesn't need the planet's detail). */
const CLOUD_TEX = { w: 1024, h: 512 }
const CLOUD_MESH = { rings: 96, segments: 192 }

/**
 * Bake the cloud layer as a separate transparent sphere node: a static (t = 0)
 * equirectangular coverage mask (in the texture's alpha) on a shell at
 * CLOUD_RADIUS_FACTOR, tinted by the cloud colour. Reuses the shared cloud GLSL,
 * so it matches the live shell. Added to the export group when clouds are enabled.
 */
export function bakeCloudMesh(renderer: WebGLRenderer, params: PlanetParams): Mesh {
  const { w, h } = CLOUD_TEX
  const uniforms = {
    uScale: { value: CLOUD_SCALE },
    uCoverage: { value: params.cloudCoverage },
  }
  const mat = new ShaderMaterial({ vertexShader: bakeVert, fragmentShader: cloudBakeFrag, uniforms })
  const quad = new Mesh(new PlaneGeometry(2, 2), mat)
  const scene = new Scene()
  scene.add(quad)
  const cam = new Camera()

  const prevTarget = renderer.getRenderTarget()
  const rt = new WebGLRenderTarget(w, h, { format: RGBAFormat, type: UnsignedByteType, depthBuffer: false })
  renderer.setRenderTarget(rt)
  renderer.render(scene, cam)
  const buf = new Uint8Array(w * h * 4)
  renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf)
  renderer.setRenderTarget(prevTarget)

  rt.dispose()
  mat.dispose()
  quad.geometry.dispose()

  // White RGB + coverage in alpha; the cloud tint comes from the baseColor factor.
  const tex = bufferToCanvasTexture(buf, w, h, SRGBColorSpace)
  const geo = buildDisplacedSphere(null, 0, 0, CLOUD_MESH.rings, CLOUD_MESH.segments, BASE_RADIUS * CLOUD_RADIUS_FACTOR, 0)
  const material = new MeshStandardMaterial({
    color: new Color(params.cloudColor),
    map: tex,
    transparent: true,
    opacity: params.cloudOpacity,
    depthWrite: false,
    roughness: 1.0,
    metalness: 0.0,
  })
  const mesh = new Mesh(geo, material)
  mesh.name = 'clouds'
  mesh.renderOrder = 1
  return mesh
}

/** Bilinear sample of the R channel of a float RGBA buffer at UV (0..1). */
function sampleHeight(buf: Float32Array, w: number, h: number, u: number, v: number): number {
  const fx = u * (w - 1)
  const fy = v * (h - 1)
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const x1 = Math.min(x0 + 1, w - 1)
  const y1 = Math.min(y0 + 1, h - 1)
  const tx = fx - x0
  const ty = fy - y0
  const at = (x: number, y: number) => buf[(y * w + x) * 4]
  const top = at(x0, y0) * (1 - tx) + at(x1, y0) * tx
  const bot = at(x0, y1) * (1 - tx) + at(x1, y1) * tx
  return top * (1 - ty) + bot * ty
}

/**
 * UV-sphere (lat-long grid) displaced by the baked height field, with
 * equirectangular UVs matching the baked textures and guaranteed outward winding.
 * Vertex normals are the smooth radial directions; the baked normal map supplies
 * the surface relief, so its tangent frame and the mesh's agree.
 */
function buildDisplacedSphere(
  heightBuf: Float32Array | null,
  texW: number,
  texH: number,
  rings: number,
  segments: number,
  radius: number,
  amplitude: number,
): BufferGeometry {
  const cols = segments + 1
  const rows = rings + 1
  const vCount = cols * rows
  const positions = new Float32Array(vCount * 3)
  const normals = new Float32Array(vCount * 3)
  const uvs = new Float32Array(vCount * 2)

  for (let j = 0; j < rows; j++) {
    const v = j / rings
    const lat = (v - 0.5) * Math.PI
    const sLat = Math.sin(lat)
    const cLat = Math.cos(lat)
    for (let i = 0; i < cols; i++) {
      const u = i / segments
      const lon = (u * 2 - 1) * Math.PI
      const dx = cLat * Math.sin(lon)
      const dy = sLat
      const dz = cLat * Math.cos(lon)
      const hgt = heightBuf ? sampleHeight(heightBuf, texW, texH, u, v) : 0
      const r = radius * (1 + hgt * amplitude)
      const idx = j * cols + i
      positions[idx * 3] = dx * r
      positions[idx * 3 + 1] = dy * r
      positions[idx * 3 + 2] = dz * r
      normals[idx * 3] = dx
      normals[idx * 3 + 1] = dy
      normals[idx * 3 + 2] = dz
      uvs[idx * 2] = u
      uvs[idx * 2 + 1] = v
    }
  }

  const indices = new Uint32Array(rings * segments * 6)
  let ii = 0
  const triOut = (a: number, b: number, c: number) => {
    const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2]
    const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2]
    const cx = positions[c * 3], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2]
    const nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay)
    const ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az)
    const nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
    if (nx * (ax + bx + cx) + ny * (ay + by + cy) + nz * (az + bz + cz) >= 0) {
      indices[ii++] = a; indices[ii++] = b; indices[ii++] = c
    } else {
      indices[ii++] = a; indices[ii++] = c; indices[ii++] = b
    }
  }
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * cols + i
      const b = j * cols + i + 1
      const c = (j + 1) * cols + i
      const d = (j + 1) * cols + i + 1
      triOut(a, c, b)
      triOut(b, c, d)
    }
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geo.setIndex(new BufferAttribute(indices, 1))
  geo.computeBoundingSphere()
  return geo
}

/** Wrap a readback RGBA8 buffer in a CanvasTexture (exports reliably via glTF). */
function bufferToCanvasTexture(
  buf: Uint8Array,
  w: number,
  h: number,
  colorSpace: typeof SRGBColorSpace | typeof NoColorSpace,
): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const img = new ImageData(new Uint8ClampedArray(buf), w, h)
  ctx.putImageData(img, 0, 0)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = colorSpace
  tex.wrapS = RepeatWrapping
  // Readback row 0 = bottom = south pole; mesh UV V=0 = south. Keep them aligned.
  tex.flipY = false
  tex.needsUpdate = true
  return tex
}
