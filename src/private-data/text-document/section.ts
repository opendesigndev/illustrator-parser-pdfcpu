import { decode as decodeASCII85 } from '../base85/base85'
import { concat } from '../buffer-ops'

type TextEncoding = 'ascii85' | 'unknown'

/**
 * Contains data of single encoded text document section.
 */
export class Section {
  private encoding: TextEncoding
  private content: Uint8Array[]

  constructor(enc: TextEncoding) {
    this.encoding = enc
    this.content = []
  }

  /**
   * @returns     total size of the content
   */
  contentSize(): number {
    return this.content.reduce((total, buf) => total + buf.length, 0)
  }

  /**
   * Adds slice of a buffer to the content array.
   *
   * @param buf   - buffer to slice from
   */
  appendContent(buf: Uint8Array) {
    this.content.push(buf)
  }

  /**
   * Decodes the buffer if encoded via known encoding,
   * namely ASCII85.
   *
   * @privateRemarks
   *
   * Note that other encodings might need to get implemented enventually.
   * Right now it seems only ASCII85 is used for TextDocument entity.
   *
   */
  decode(): Uint8Array {
    const data = concat(this.content)
    return this.encoding === 'ascii85' ? decodeASCII85(data) : data
  }
}
