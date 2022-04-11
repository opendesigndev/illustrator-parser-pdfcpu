import './go-polyfill'
import './go'
import type { Go } from './go'
import type { WasmContext } from './interfaces'
import { Proxy } from './proxy'

export type { BitmapReader, FontReader, Bitmap, Font } from './go'
export type { WasmContext } from './interfaces'

async function instantiate(go: Go): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  const path = new URL('aicpu.wasm', import.meta.url).pathname
  try {
    const { readFileSync } = await import('fs')
    return WebAssembly.instantiate(readFileSync(path), go.importObject)
  } catch {
    const wasmModule = fetch(path)
    return WebAssembly.instantiateStreaming(wasmModule, go.importObject)
  }
}

const ONE_GIGABYTE = 1024 * 1024 * 1024

export interface WASMContextOptions {
  bufferSize?: number
}
export async function WASMContext(data: Uint8Array, options: WASMContextOptions = {}): Promise<WasmContext> {
  if (data.length > ONE_GIGABYTE) {
    throw new Error(`WASMContext data argument has length ${data.length}, more than supported ${ONE_GIGABYTE}`)
  }
  if (!globalThis.IllustratorParser) {
    const go = new globalThis.Go()
    if (options.bufferSize) go.env['BUFFER_SIZE'] = options.bufferSize.toString()
    const result = await instantiate(go)
    go.run(result.instance)
  }

  const aicpu = globalThis.IllustratorParser
  if (!aicpu) {
    throw new Error('AssertionError: WASM code failed to define IllustratorParser')
  }
  if (options.bufferSize && aicpu.bufferSize < options.bufferSize)
    throw new Error(
      'Requested bufferSize is larger than already initialized instance;" \
      + "you need to exit() previous instance of WASMContext before allocating larger buffer'
    )

  const parsed = await aicpu.parse(data)
  return new Proxy(aicpu, parsed)
}
