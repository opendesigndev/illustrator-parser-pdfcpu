import { startsWith } from './buffer-ops'
import { ArtBoardNames, RawPrivateData } from './interfaces'
import { TextDocument } from './text-document/interfaces'
import { Section } from './text-document/section'

const FWD_SLASH = '/'.charCodeAt(0)
const COMMENT_START = '%'.charCodeAt(0)
const beginKeyword = '%AI11_BeginTextDocument'
const endKeyword = '%AI11_EndTextDocument'

// %_(Mesa de trabajo 1) /UnicodeString (Name) ,
// ->
// Mesa de trabajo 1
const re = RegExp('%_\\((.+)\\) /UnicodeString \\(Name\\) ,', '')
function extractLayerName(text: string): string | undefined {
  const match = re.exec(text)
  if (match) return match[1]
  return undefined
}

export class SectionSplitter {
  sections: Section[] = []
  currentSection: Section | undefined
  names: string[] = []
  textDocumentStarted = false

  constructor(private readonly decoder: TextDecoder, private readonly data: RawPrivateData) {}

  async split(): Promise<[TextDocument, ArtBoardNames]> {
    for await (const value of this.data()) {
      if (value[0] === COMMENT_START) {
        const text = this.decoder.decode(value)
        if (text.startsWith(beginKeyword)) {
          this.textDocumentStarted = true
        }
        if (text.startsWith(endKeyword)) {
          this.textDocumentStarted = false
        }
        const layerName = extractLayerName(text)
        if (layerName) {
          this.names.push(layerName)
        }
      }
      if (this.textDocumentStarted) {
        this.handleTextDocumentLine(value)
      }
    }

    if (this.currentSection) {
      this.sections.push(this.currentSection)
    }
    return [this.sections, this.names]
  }

  /**
   * Loads TextDocument part of the AI private data.
   */
  private handleTextDocumentLine(line: Uint8Array) {
    switch (line[0]) {
      case FWD_SLASH:
        // this is rare, so testing with startsWith is fine
        if (startsWith(line, '/AI11TextDocument') || startsWith(line, '/AI11UndoFreeTextDocument')) {
          const lineStr = this.decoder.decode(line)
          const enc = lineStr.split(' ').includes('/ASCII85Decode') ? 'ascii85' : 'unknown'

          if (this.currentSection) {
            this.sections.push(this.currentSection)
          }

          this.currentSection = new Section(enc)
        }
        break

      case COMMENT_START:
        this.currentSection?.appendContent(line.subarray(1)) // remove %
        break
    }
  }
}
