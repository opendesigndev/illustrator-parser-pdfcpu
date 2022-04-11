import { Dict, Array, LiteralString, OperandType } from '../../syntax/interfaces'
import { EscapeSequence, escapeSequences } from '../../syntax/strings'
import { Frame } from './interfaces'

const BACKSLASH = '\\'.charCodeAt(0)
const LEFT_PAREN = '('.charCodeAt(0)
const RIGHT_PAREN = ')'.charCodeAt(0)

export class LayerDecoder {
  private decoder = new TextDecoder('utf-16be')

  public content(layer: Dict): string {
    const buffer = (((layer as Dict).value.get('0') as Dict).value.get('0') as LiteralString).value
    let content = this.decode(buffer)
    if (content.slice(-1)[0] === '\r') {
      content = content.slice(0, -1)
    }
    return content
  }

  public frame(layer: Dict): Frame | undefined {
    let frame: Frame | undefined = undefined
    let pipe: Dict | Array | undefined
    pipe = layer.value.get('1') as Dict
    pipe = pipe?.value.get('2') as Array
    pipe = pipe?.value[0] as Dict
    pipe = pipe?.value.get('6') as Array
    pipe = pipe?.value[0] as Dict
    const frameArr = pipe?.value.get('1') as Array
    if (
      frameArr &&
      frameArr.value.length === 4 &&
      frameArr.value[2].type === OperandType.Number &&
      frameArr.value[3].type === OperandType.Number
    ) {
      frame = {
        width: frameArr.value[2].value,
        height: frameArr.value[3].value,
      }
    }
    return frame
  }

  public decode(buffer: Uint8Array): string {
    const bom = buffer.slice(0, 2)
    console.assert(bom[0] === 0xfe && bom[1] === 0xff, 'BOM in text document is not BE')
    return this.decodeEscapeSequences(buffer.slice(2))
  }

  private decodeEscapeSequences(buffer: Uint8Array): string {
    let txt = ''
    for (const val of escapeSequences<number, Uint8Array, Uint8Array>(buffer, BACKSLASH)) {
      if (!val.escaped) {
        txt += this.decoder.decode(val.text, { stream: true })
      } else {
        txt += this.decodeSingleEscapeSequence(val)
      }
    }
    // NOTE stream: Set to true if processing the data in chunks, and false for the final chunk or if the data is not chunked.
    txt += this.decoder.decode(Uint8Array.of(), { stream: false })
    return txt
  }

  private decodeSingleEscapeSequence(val: EscapeSequence<Uint8Array>): string {
    let substitute: number
    let position: number
    if (val.text[0] === LEFT_PAREN || val.text[0] === RIGHT_PAREN) {
      substitute = val.text[0]
      position = 1
    } else {
      throw new Error(`Not Implemented: found escape sequence '${val.text}' which is not implemented.`)
    }

    return (
      this.decoder.decode(Uint8Array.of(substitute), { stream: true }) +
      this.decoder.decode(val.text.slice(position, val.text.length), { stream: true })
    )
  }
}
