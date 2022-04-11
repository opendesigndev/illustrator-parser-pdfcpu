import { PrivateData, RawPrivateData } from './interfaces'
import { extractTextLayersContent } from './text-document'
import { Parser as SyntaxParser } from '../syntax/parser'
import { mark, stop } from 'marky'
import { SectionSplitter } from './section-splitter'
import { TextDocument, TextLayerRecord } from './text-document/interfaces'

export class Parser {
  private decoder = new TextDecoder()

  public async extract(data: RawPrivateData): Promise<PrivateData> {
    const [textDocument, names] = await new SectionSplitter(this.decoder, data).split()

    return {
      TextLayers: this.loadTextLayers(textDocument),
      LayerNames: names,
    }
  }

  private loadTextLayers(textDocument: TextDocument): TextLayerRecord[] | undefined {
    mark('loadTextLayers')
    if (textDocument.length < 1) {
      throw new Error('TextDocument entity is missing in the private data section')
    }

    const decodedStream = textDocument[0].decode()
    mark('parse text document stream')

    const textDocumentDict = new SyntaxParser(decodedStream).parseDict()
    stop('parse text document stream')

    const extracted = extractTextLayersContent(textDocumentDict)

    stop('loadTextLayers')
    return extracted
  }
}
