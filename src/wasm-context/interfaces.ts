import type { Context } from '../interfaces'
import type { ParsedFile } from './go'

export interface WasmContext extends Context {
  Bitmaps: ParsedFile['bitmaps']
  Fonts: ParsedFile['fonts']

  exit: () => void
}
