import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { exportApi } from '@/export/exportApi'

/** Lives inside <Canvas>; exposes the live WebGLRenderer to the export pipeline. */
export function CaptureRenderer() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    exportApi.renderer = gl
    return () => {
      if (exportApi.renderer === gl) exportApi.renderer = null
    }
  }, [gl])
  return null
}
