/** Whether the browser can create a WebGL2 context (required by the renderer). */
export function supportsWebGL2(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}
