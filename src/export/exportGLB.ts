import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import type { Object3D } from 'three'
import { downloadBlob } from '@/lib/download'

/** Serialize an Object3D to a binary glTF (GLB) ArrayBuffer. */
export function objectToGLB(object: Object3D): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(
      object,
      (result) => resolve(result as ArrayBuffer),
      (error) => reject(error),
      { binary: true, onlyVisible: true },
    )
  })
}

/** Serialize an Object3D to a binary glTF (GLB) and download it. */
export async function exportGLB(object: Object3D, filename: string): Promise<void> {
  const buffer = await objectToGLB(object)
  downloadBlob(new Blob([buffer], { type: 'model/gltf-binary' }), filename)
}

/** Serialize to a self-contained (embedded) text glTF (.gltf) and download it. */
export async function exportGLTF(object: Object3D, filename: string): Promise<void> {
  const json = await new Promise<object>((resolve, reject) => {
    new GLTFExporter().parse(
      object,
      (result) => resolve(result as object),
      (error) => reject(error),
      { binary: false, onlyVisible: true },
    )
  })
  downloadBlob(new Blob([JSON.stringify(json)], { type: 'model/gltf+json' }), filename)
}

/** Binary STL (geometry only) — for 3D printing. Pass the solid planet mesh. */
export async function exportSTL(object: Object3D, filename: string): Promise<void> {
  const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js')
  const data = new STLExporter().parse(object, { binary: true }) as unknown as BlobPart
  downloadBlob(new Blob([data], { type: 'model/stl' }), filename)
}

/** Wavefront OBJ (geometry + normals + UVs, no material). */
export async function exportOBJ(object: Object3D, filename: string): Promise<void> {
  const { OBJExporter } = await import('three/examples/jsm/exporters/OBJExporter.js')
  downloadBlob(new Blob([new OBJExporter().parse(object)], { type: 'text/plain' }), filename)
}

/** USDZ (textured) — for AR Quick Look / Scene Viewer. Pass the full group. */
export async function exportUSDZ(object: Object3D, filename: string): Promise<void> {
  const { USDZExporter } = await import('three/examples/jsm/exporters/USDZExporter.js')
  const bytes = await new USDZExporter().parseAsync(object)
  downloadBlob(new Blob([bytes as unknown as BlobPart], { type: 'model/vnd.usdz+zip' }), filename)
}
