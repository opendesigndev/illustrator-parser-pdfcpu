import { TextLayerRecord } from './text-document/interfaces'

export type RawPrivateData = () => AsyncGenerator<Uint8Array>
export type PrivateData = {
  TextLayers?: TextLayerRecord[]
  LayerNames: string[]
}

export type ArtBoardNames = string[]
