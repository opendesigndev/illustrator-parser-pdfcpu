import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import solidSvg from 'vite-plugin-solid-svg'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import { splitVendorChunkPlugin } from 'vite'

export default defineConfig({
  plugins: [
    solidPlugin(),
    solidSvg(),
    monacoEditorPlugin({ languageWorkers: ['editorWorkerService', 'json'] }),
    splitVendorChunkPlugin(),
  ],
  build: {
    target: 'esnext',
    polyfillDynamicImport: false,
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
})
