import { LayerDecoder } from '../src/private-data/text-document/layer'

import { test, expect } from 'vitest'

test('LayerDecoder: extracts layer content', async () => {
  const decoder = new LayerDecoder()
  const value = decoder.decode(Uint8Array.of(0xfe, 0xff, 0, 48, 0, 49, 0, 50))
  expect(value).toStrictEqual('012')
})

test('LayerDecoder: decodes \\( and \\)  escape sequences', async () => {
  const decoder = new LayerDecoder()
  const buffer = Uint8Array.of(
    0xfe,
    0xff,
    0,
    '\\'.charCodeAt(0),
    '('.charCodeAt(0),
    0,
    '\\'.charCodeAt(0),
    ')'.charCodeAt(0)
  )
  const value = decoder.decode(buffer)
  expect(value).toStrictEqual('()')
})
