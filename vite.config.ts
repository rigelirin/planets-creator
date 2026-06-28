import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Lets .glsl/.vert/.frag files `#include` each other and import as strings.
    // removeDuplicatedImports: noise.glsl can be included by several chunks in the
    // same fragment stage without redefining its functions.
    glsl({ minify: false, removeDuplicatedImports: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // The main chunk is dominated by three.js + R3F, which are required for the
    // first paint, so forcing a vendor split only grows the total download. The
    // export path (bake + GLTFExporter) is instead lazily imported in runExport,
    // so it lands in its own deferred chunk. This limit acknowledges that floor.
    chunkSizeWarningLimit: 1500,
  },
})
