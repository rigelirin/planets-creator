/// <reference types="vite/client" />

// Shader files imported as strings (handled by vite-plugin-glsl).
declare module '*.glsl' {
  const value: string
  export default value
}
declare module '*.vert' {
  const value: string
  export default value
}
declare module '*.frag' {
  const value: string
  export default value
}
