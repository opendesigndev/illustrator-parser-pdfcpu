const NUM_MAXVALUE = Math.pow(2, 32) - 1

const QUAD85 = 85 * 85 * 85 * 85
const TRIO85 = 85 * 85 * 85
const DUO85 = 85 * 85
const SING85 = 85

/* Characters to ignore in an encoded buffer */
const IGNORE_CHARS = [
  0x09 /* horizontal tab */, 0x0a /* line feed, new line */, 0x0b /* vertical tab */, 0x0c /* form feed, new page */,
  0x0d /* carriage return */, 0x20 /* space */,
]

const ASCII85_ENC_END = '~>'

class Base85DecoderError extends Error {
  constructor(offset: number) {
    super(`invalid base85 buffer, decode failed at offset: ${offset}`)
    this.name = this.constructor.name
  }
}

/**
 * Decodes base85-encoded buffer.
 *
 * @param buffer - encoded buffer
 *
 * @returns     decoded buffer
 *
 * @throws {@link Base85DecoderError}
 * Thrown if input buffer is not a valid base85 stream.
 */
export function decode(buffer: Uint8Array): Uint8Array {
  const decodeSymbol = (x: number) => {
    return x - 33
  }

  const nextValidByte = (index: number) => {
    if (index < dataLength) {
      while (-1 !== IGNORE_CHARS.indexOf(buffer[index])) {
        padding = (padding + 1) % 5
        ++index
      }
    }
    return index
  }

  const dataLength = buffer.length - ASCII85_ENC_END.length

  let padding = dataLength % 5 === 0 ? 0 : 5 - (dataLength % 5)

  const resultBuffer = new ArrayBuffer(4 * Math.ceil(dataLength / 5))
  const resultView = new DataView(resultBuffer)

  let writeIndex = 0
  for (let i = 0; i < dataLength; writeIndex += 4) {
    let num = 0

    i = nextValidByte(i)
    num = decodeSymbol(buffer[i]) * QUAD85

    i = nextValidByte(i + 1)
    num += (i >= dataLength ? 84 : decodeSymbol(buffer[i])) * TRIO85

    i = nextValidByte(i + 1)
    num += (i >= dataLength ? 84 : decodeSymbol(buffer[i])) * DUO85

    i = nextValidByte(i + 1)
    num += (i >= dataLength ? 84 : decodeSymbol(buffer[i])) * SING85

    i = nextValidByte(i + 1)
    num += i >= dataLength ? 84 : decodeSymbol(buffer[i])

    i = nextValidByte(i + 1)

    if (num > NUM_MAXVALUE || num < 0) {
      throw new Base85DecoderError(i)
    }

    resultView.setUint32(writeIndex, num, false /* BE */)
  }

  return new Uint8Array(resultBuffer, 0, writeIndex - padding)
}
