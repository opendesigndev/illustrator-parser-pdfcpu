export type Frame = {
  width: number
  height: number
}

interface Section {
  decode(): Uint8Array
}
export type TextDocument = Section[]

export type TextLayerRecord = {
  name?: string
  content: string
  index: number
  frame?: Frame
}
