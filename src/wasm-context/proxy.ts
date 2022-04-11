import type { AIFile, StreamDictFetcher } from '../interfaces'
import type { ParsedFile, AICpu } from './go'
import type { PrivateData } from '../private-data/interfaces'
import type { Font } from '../contents/text-encoding'
import type { WasmContext } from './interfaces'

const CARRIAGE_RETURN = '\r'.charCodeAt(0)
const LINE_FEED = '\n'.charCodeAt(0)
export class Proxy implements WasmContext {
  public readonly aiFile: AIFile
  public readonly streamDict: StreamDictFetcher
  public readonly Bitmaps: ParsedFile['bitmaps']
  public readonly Fonts: ParsedFile['fonts']
  public readonly xobjectMutex: Map<number, Promise<unknown[]>> = new Map()
  public readonly fontCache: Map<number, Promise<Font>> = new Map()
  public readonly parsedPrivateData?: Promise<PrivateData>
  public readonly strictPopplerCompat = true

  private _privateDataCalled = false

  constructor(private readonly aicpu: AICpu, private readonly parsed: ParsedFile) {
    this.aiFile = JSON.parse(this.parsed.value) as AIFile

    this.streamDict = this.parsed.streamDict

    this.Bitmaps = this.parsed.bitmaps
    this.Fonts = this.parsed.fonts
  }

  public async *privateData(): AsyncGenerator<Uint8Array> {
    if (this._privateDataCalled) throw new Error('AssertionError: WASMContext.privateData called twice')
    this._privateDataCalled = true
    for (;;) {
      const { value, done } = await this.parsed.privateData.next()
      let line = value
      for (;;) {
        while (line[0] === LINE_FEED) line = line.subarray(1)
        while (line[0] === CARRIAGE_RETURN) line = line.subarray(1)

        const offset = line.indexOf(CARRIAGE_RETURN)
        yield line.subarray(0, offset)
        if (offset === -1) break
        line = line.subarray(offset + 1)
      }
      if (done) break
    }
  }

  public exit() {
    this.aicpu.exit()
    globalThis.IllustratorParser = undefined
  }
}
