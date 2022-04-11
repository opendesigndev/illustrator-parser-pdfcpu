// Original source: https://github.com/KenanY/get-random-values/blob/1e727b95bc162a7afbb6608687950101fae573ab/index.js#L10
// Modified to our needs
// Copyright 2014–2022 Kenan Yildirim <https://kenany.me/>

// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
import * as crypto from 'crypto'
function getRandomValues<T extends ArrayBufferView | null>(buf: T): T {
  if (typeof crypto.randomBytes === 'function') {
    if (!(buf instanceof Uint8Array)) {
      throw new TypeError('expected Uint8Array')
    }
    if (buf.length > 65536) {
      const e = new Error()
      e.message =
        "Failed to execute 'getRandomValues' on 'Crypto': The " +
        "ArrayBufferView's byte length (" +
        buf.length +
        ') exceeds the ' +
        'number of bytes of entropy available via this API (65536).'
      e.name = 'QuotaExceededError'
      throw e
    }
    const bytes = crypto.randomBytes(buf.length)
    buf.set(bytes)
    return buf
  } else {
    throw new Error('No secure random number generator available.')
  }
}

if (typeof globalThis.crypto !== 'object') {
  globalThis.crypto = {} as Crypto
}

if (typeof globalThis.crypto.getRandomValues !== 'function') {
  globalThis.crypto.getRandomValues = getRandomValues
}
