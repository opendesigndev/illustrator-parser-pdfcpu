// https://web.archive.org/web/20220226063926/https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf
// 7.8.2 Content Streams

import { Decoder, FontReader } from './decoder'
import { parseOperators, Resources } from './interfaces'
import { New } from './state'
import { Reducer } from './reducer'

export async function parse(
  data: Uint8Array,
  resources: Resources,
  fontReader: FontReader,
  strictPopplerCompat: boolean
): Promise<unknown[]> {
  const decoder = new Decoder(fontReader)
  const ops = parseOperators(data)
  const state = await new Reducer(ops).run(
    New({
      decoder,
      resources,
      strictPopplerCompat,
    })
  )
  console.assert(state.context.size === 1, `leftover ${state.context.size - 1} marked contexts on stack`)
  return state.context.first()?.Kids.toJS() ?? []
}
