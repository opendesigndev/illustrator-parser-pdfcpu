import { storeonLogger } from 'storeon/devtools'
import { createStoreon, StoreonModule } from 'storeon'
import type { WasmContext } from '../../dist/wasm_context'

// State structure
export interface State {
  file?: File
  error?: Error
  ctx?: WasmContext
}

// Events declaration: map of event names to type of event data
export interface Events {
  processFile: File
  error: Error
  ctx: WasmContext
  home: void
  unparse: void
  hideError: void
}

const illustratorModule: StoreonModule<State, Events> = (store) => {
  store.on('processFile', (_state, file) => ({ file }))
  store.on('error', (_state, error) => ({ error }))
  store.on('ctx', (_state, ctx) => ({ ctx }))
  store.on('home', (_state) => ({ file: undefined, ctx: undefined }))
  store.on('unparse', (_state) => ({ ctx: undefined }))
  store.on('hideError', (_state) => ({ error: undefined }))
}

export const store = createStoreon<State, Events>([
  illustratorModule,
  process.env.NODE_ENV !== 'production' && storeonLogger,
])
