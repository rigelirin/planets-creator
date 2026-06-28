import { BufferAttribute, BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'

/**
 * Builds a cube-sphere: six subdivided faces warped onto the unit sphere, merged
 * into one indexed BufferGeometry. Clean per-face UVs (a 3x2 atlas), easy LOD, and
 * no pole pinch. Vertices on shared face edges are duplicated — harmless, because
 * the terrain shader displaces by a function of direction so the seam is continuous.
 *
 * Attributes: position (unit sphere * radius), normal (outward unit direction),
 * uv (per-face atlas tile). The terrain material recomputes a displaced normal in
 * the vertex shader; the stored normal is just a sane default.
 */

const FACE_NORMALS: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 0],
  [0, -1, 0],
  [1, 0, 0],
  [-1, 0, 0],
  [0, 0, 1],
  [0, 0, -1],
]

/** Analytic cube->sphere mapping (Philip Rideout); more uniform than normalize(). */
function spherify(x: number, y: number, z: number): [number, number, number] {
  const x2 = x * x
  const y2 = y * y
  const z2 = z * z
  return [
    x * Math.sqrt(1 - y2 / 2 - z2 / 2 + (y2 * z2) / 3),
    y * Math.sqrt(1 - z2 / 2 - x2 / 2 + (z2 * x2) / 3),
    z * Math.sqrt(1 - x2 / 2 - y2 / 2 + (x2 * y2) / 3),
  ]
}

/** Emit a triangle with outward winding (so FrontSide culling never holes the sphere). */
function pushTriOutward(
  indices: Uint32Array,
  cursor: number,
  pos: Float32Array,
  i0: number,
  i1: number,
  i2: number,
): number {
  const ax = pos[i0 * 3], ay = pos[i0 * 3 + 1], az = pos[i0 * 3 + 2]
  const bx = pos[i1 * 3], by = pos[i1 * 3 + 1], bz = pos[i1 * 3 + 2]
  const cx = pos[i2 * 3], cy = pos[i2 * 3 + 1], cz = pos[i2 * 3 + 2]
  // geometric normal = (b-a) x (c-a)
  const e1x = bx - ax, e1y = by - ay, e1z = bz - az
  const e2x = cx - ax, e2y = cy - ay, e2z = cz - az
  const nx = e1y * e2z - e1z * e2y
  const ny = e1z * e2x - e1x * e2z
  const nz = e1x * e2y - e1y * e2x
  // outward if normal agrees with the centroid (sphere centered at origin)
  const facing = nx * (ax + bx + cx) + ny * (ay + by + cy) + nz * (az + bz + cz)
  if (facing >= 0) {
    indices[cursor++] = i0
    indices[cursor++] = i1
    indices[cursor++] = i2
  } else {
    indices[cursor++] = i0
    indices[cursor++] = i2
    indices[cursor++] = i1
  }
  return cursor
}

export function createCubeSphereGeometry(radius = 1, segments = 160): BufferGeometry {
  const N = segments + 1 // points per side
  const perFace = N * N
  const vertexCount = perFace * 6
  const indexCount = segments * segments * 36 // 6 faces * (quad = 2 tris * 3)

  const positions = new Float32Array(vertexCount * 3)
  const normals = new Float32Array(vertexCount * 3)
  const uvs = new Float32Array(vertexCount * 2)
  const indices = new Uint32Array(indexCount)

  const up = new Vector3()
  const axisA = new Vector3()
  const axisB = new Vector3()

  let vi = 0
  let ii = 0

  for (let f = 0; f < 6; f++) {
    const fn = FACE_NORMALS[f]
    up.set(fn[0], fn[1], fn[2])
    axisA.set(up.y, up.z, up.x) // a perpendicular tangent
    axisB.crossVectors(up, axisA) // the second tangent

    const atlasCol = f % 3
    const atlasRow = Math.floor(f / 3)
    const faceVertStart = f * perFace

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const px = x / segments
        const py = y / segments
        const sx = px * 2 - 1
        const sy = py * 2 - 1
        const cx = up.x + sx * axisA.x + sy * axisB.x
        const cy = up.y + sx * axisA.y + sy * axisB.y
        const cz = up.z + sx * axisA.z + sy * axisB.z
        const [ux, uy, uz] = spherify(cx, cy, cz)

        const o = vi * 3
        positions[o] = ux * radius
        positions[o + 1] = uy * radius
        positions[o + 2] = uz * radius
        normals[o] = ux
        normals[o + 1] = uy
        normals[o + 2] = uz

        const uo = vi * 2
        uvs[uo] = (atlasCol + px) / 3
        uvs[uo + 1] = (atlasRow + py) / 2
        vi++
      }
    }

    for (let y = 0; y < segments; y++) {
      for (let x = 0; x < segments; x++) {
        const a = faceVertStart + y * N + x
        const b = faceVertStart + y * N + (x + 1)
        const c = faceVertStart + (y + 1) * N + x
        const d = faceVertStart + (y + 1) * N + (x + 1)
        ii = pushTriOutward(indices, ii, positions, a, c, b)
        ii = pushTriOutward(indices, ii, positions, b, c, d)
      }
    }
  }

  const geom = new BufferGeometry()
  geom.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geom.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geom.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geom.setIndex(new BufferAttribute(indices, 1))
  geom.computeBoundingSphere()
  return geom
}
