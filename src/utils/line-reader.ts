import * as fs from 'fs'

const CARRIAGE_RETURN = '\r'.charCodeAt(0)
const LINE_FEED = '\n'.charCodeAt(0)
export async function* lineReader(file: string): AsyncGenerator<Uint8Array> {
  let leftover = null as Uint8Array | null
  for await (const chunks of fs.createReadStream(file)) {
    let offset = chunks.indexOf(CARRIAGE_RETURN)
    let lastOffset = 0
    while (offset >= 0) {
      // Private data files have combination of \r, \n, \r\n and everything in between. Beware.
      while (chunks[lastOffset] === LINE_FEED) lastOffset += 1
      const chunk = chunks.subarray(lastOffset, offset)
      let line = chunk
      if (leftover) {
        line = Buffer.concat([leftover, chunk])
        leftover = null
      }
      if (line[0] === CARRIAGE_RETURN) throw new Error('line starts with 0x0d')
      if (line[0] === LINE_FEED) throw new Error('line starts with 0x0a')
      yield line
      lastOffset = offset + 1
      offset = chunks.indexOf(CARRIAGE_RETURN, lastOffset)
    }
    while (chunks[lastOffset] === LINE_FEED) lastOffset += 1
    if (lastOffset < chunks.length) leftover = chunks.slice(lastOffset)
  }
  if (leftover) yield leftover
}
