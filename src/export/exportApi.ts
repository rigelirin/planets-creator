import type { WebGLRenderer } from 'three'

/**
 * Bridges the DOM "Export" button (outside the Canvas) to the live WebGLRenderer
 * (inside the Canvas). CaptureRenderer sets this on mount; the bake reads it.
 */
export const exportApi: { renderer: WebGLRenderer | null } = { renderer: null }
