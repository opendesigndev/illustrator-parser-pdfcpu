import type { StreamDictFetcher } from '../interfaces'

export interface Bitmap {
  name: string
  mime: string
  content: Uint8Array
}
export type BitmapReader = () => Promise<Bitmap>

export interface Font {
  name: string
  type: string
  content: Uint8Array
}
export type FontReader = () => Promise<Font>

export interface ParsedFile {
  value: string // JSON-serialized
  bitmaps: Record<number, BitmapReader>
  fonts: Record<number, FontReader>
  // privateData: () => Promise<{ done: boolean, value: Uint8Array }> // almost AsyncIterator, dunno how to create one from Go WASM
  privateData: AsyncIterator<Uint8Array>
  streamDict: StreamDictFetcher
}

export interface AICpu {
  parse: (fileBytes: Uint8Array) => Promise<ParsedFile>
  exit: () => void
  bufferSize: number
}

class Go {
  importObject: WebAssembly.Imports
  run(instance: WebAssembly.Instance): Promise<void>
  constructor()
}

export type Go = Go

declare global {
  // called by wasm exec
  // eslint complains about var - wtf?
  // eslint-disable-next-line
  var IllustratorParser: AICpu | undefined
  // set by wasm exec
  // eslint complains about var - wtf?
  // eslint-disable-next-line
  var Go = Go
}
