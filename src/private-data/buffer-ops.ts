export function startsWith(buffer: Uint8Array, str: string, offset = 0): boolean {
  if (offset + str.length > buffer.length) {
    // str doesn't fit into the buffer
    return false
  }

  for (let i = 0; i < str.length; ++i) {
    if (buffer[offset + i] !== str.charCodeAt(i)) {
      return false
    }
  }

  return true
}

export function concat(buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0)

  const output = new Uint8Array(totalLength)
  let offset = 0

  for (let i = 0; i < buffers.length; ++i) {
    output.set(buffers[i], offset)
    offset += buffers[i].length
  }

  return output
}
