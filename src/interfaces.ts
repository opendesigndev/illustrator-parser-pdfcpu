import { Font } from './contents/text-encoding'

import { XRefTable } from './pdf-types'
import { PrivateData, RawPrivateData } from './private-data/interfaces'

export interface AIFile {
  XRefTable: XRefTable
  Version: string
}

export type StreamDictFetcher = (objId: number) => Promise<Uint8Array>

export interface Context {
  aiFile: AIFile
  streamDict: StreamDictFetcher
  privateData: RawPrivateData

  // Images & fonts are references to external resources.
  // e.g. in FSContext as files on disk
  // externalResourceURLs may be used to map references in the returned objects to something else
  // e.g. URLs of files uploaded to CDN
  externalResourceURLs?: {
    Bitmaps: { [key: string]: unknown }
    Fonts: { [key: string]: unknown }
  }

  xobjectMutex: Map<number, Promise<unknown[]>>
  fontCache: Map<number, Promise<Font>>
  parsedPrivateData?: Promise<PrivateData>
  // Enables transformations that bring output closer to Poppler results
  strictPopplerCompat?: true
}

export type ContentsDict = {
  // this is parsed content stream,
  Data: unknown[]
  // in previous version there were extra keys which are obsolete:
  Kind?: number
  Length?: unknown
  Filter?: unknown
}
