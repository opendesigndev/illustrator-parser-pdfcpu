import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

const indexConfig = (override) => ({
  input: 'src/index.ts',
  output: {
    format: override.format,
    file: override.dst,
  },
  external: ['gl-matrix', 'marky', 'immutable'],
  plugins: override.plugins,
})

const fsContextConfig = (override) => ({
  input: 'src/fs-context.ts',
  output: {
    format: override.format,
    file: override.dst,
  },
  external: ['fs', 'readline', 'child_process', 'fs/promises', 'util', 'path', 'marky', 'node:url'],
  plugins: override.plugins,
})

const wasmContextConfig = (override) => ({
  input: 'src/wasm-context/index.ts',
  output: {
    format: override.format,
    file: override.dst,
  },
  external: ['fs', 'crypto'],
  plugins: override.plugins,
})

export default [
  indexConfig({ plugins: [typescript()], format: 'cjs', dst: 'dist/index.cjs' }),
  indexConfig({ plugins: [dts()], dst: 'dist/index.d.cts' }),
  indexConfig({ plugins: [typescript()], format: 'es', dst: 'dist/index.mjs' }),
  indexConfig({ plugins: [dts()], dst: 'dist/index.d.ts' }),

  fsContextConfig({ plugins: [typescript()], format: 'cjs', dst: 'dist/fs_context.cjs' }),
  fsContextConfig({ plugins: [dts()], dst: 'dist/fs_context.d.cts' }),
  fsContextConfig({ plugins: [typescript()], format: 'es', dst: 'dist/fs_context.mjs' }),
  fsContextConfig({ plugins: [dts()], dst: 'dist/fs_context.d.ts' }),

  wasmContextConfig({ plugins: [typescript()], format: 'cjs', dst: 'dist/wasm_context.cjs' }),
  wasmContextConfig({ plugins: [dts()], dst: 'dist/wasm_context.d.cts' }),
  wasmContextConfig({ plugins: [typescript()], format: 'es', dst: 'dist/wasm_context.mjs' }),
  wasmContextConfig({ plugins: [dts()], dst: 'dist/wasm_context.d.ts' }),
]
