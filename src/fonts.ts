import { parseCMapOperators } from './cmap'
import { Differences, FontRef } from './contents/decoder'
import { Font } from './contents/text-encoding'
import { StreamDictFetcher } from './interfaces'
import { Operands, OperandType } from './syntax/interfaces'
import { Cache } from './utils/memoize'

export class FontReader {
  private decoder = new TextDecoder('utf-16be')
  private cache: Cache<number, Promise<Font>>

  constructor(private readonly streamDict: StreamDictFetcher, fontCache: Map<number, Promise<Font>>) {
    this.cache = new Cache(fontCache)
  }

  public get(fontID: FontRef): Promise<Font> {
    return this.cache.upsert(fontID.ObjID, () => this.parse(fontID))
  }

  public async parse(fontRef: FontRef): Promise<Font> {
    return {
      ToUnicode: fontRef.ToUnicode && this.parseToUnicode(await this.streamDict(fontRef.ToUnicode.ObjID)),
      Encoding:
        typeof fontRef.Encoding === 'string'
          ? fontRef.Encoding
          : {
              Differences: this.parseDifferences(fontRef.Encoding.Differences),
              BaseEncoding: fontRef.Encoding.BaseEncoding,
            },
    }
  }

  private parseDifferences(diffs: Differences): Map<number, string> {
    const mapping = new Map()
    let idx = 0
    for (const diff of diffs) {
      if (typeof diff === 'number') {
        idx = diff
      } else {
        // TODO: this should be read from tables in Annex D
        mapping.set(idx, diff[0])
        idx += 1
      }
    }
    return mapping
  }

  private parseBFCharValue(value: string): string {
    const matches = value.match(/../g)
    if (!matches) {
      throw new Error(`AssertionError: hexadecimal string: '${value}' failed to match`)
    }
    const bytes = new Uint8Array(matches.map((v: string) => parseInt(v, 16)))
    return this.decoder.decode(bytes)
  }

  private parseBFChar(args: Operands): Map<number, string> {
    const mapping = new Map()
    let key = null
    for (const op of args) {
      if (op.type !== OperandType.HexadecimalString) {
        throw new Error(`AssertionError: non-hexadecimal string: '${op.type}' in parseBFChar`)
      }
      if (key) {
        mapping.set(key, this.parseBFCharValue(op.value))
        key = null
      } else {
        const val = parseInt(op.value, 16)
        key = val
      }
    }
    return mapping
  }

  private parseToUnicode(data: Uint8Array): Map<number, string> {
    const ops = parseCMapOperators(data)
    let value = new Map()
    for (const op of ops) {
      switch (op.name) {
        case 'endbfchar':
          value = new Map([...value, ...this.parseBFChar(op.args)])
          continue
        case 'endbfrange':
          console.warn("'bfrange' is currently not supported")
          continue
      }
    }
    return value
  }
}
