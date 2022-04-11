import { Dict, Operand, Array, OperandType } from '../../syntax/interfaces'
import { LayerDecoder } from './layer'
import { TextLayerRecord } from './interfaces'

export function extractTextLayersContent(textDocumentDict: Map<string, Operand>): TextLayerRecord[] {
  const textLayers = (textDocumentDict.get('1') as Dict)?.value.get('1') as Array | undefined
  const decoder = new LayerDecoder()
  return (
    textLayers?.value.map((layer, index) => {
      console.assert(layer.type === OperandType.Dict)
      const content = decoder.content(layer as Dict)
      const frame = decoder.frame(layer as Dict)
      return { content, index, frame }
    }) ?? []
  )
}
