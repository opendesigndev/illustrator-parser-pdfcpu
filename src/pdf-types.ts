import { hasOwnProperty, isNonNullObject } from './utils/types'

export function isPDFRef(value: unknown): value is PDFRef {
  if (typeof value !== 'object') return false
  if (value === null) return false
  return hasOwnProperty(value, 'ObjectNumber') && hasOwnProperty(value, 'GenerationNumber')
}

export interface PDFRef {
  ObjectNumber: number
  GenerationNumber: number
}

export type PDFValue = null | number | string | boolean

export type PDFObject<A> =
  | {
      [key: string]: A | PDFObject<A>
    }
  | PDFObject<A>[]
  | A

export type PDFObjectWithoutRefs = PDFObject<PDFValue>
export type PDFObjectWithRefs = PDFObject<PDFValue | PDFRef>

export function isXPages(value: unknown): value is XPages {
  if (typeof value !== 'object') return false
  if (value === null) return false
  return hasOwnProperty(value, 'Type') && value['Type'] === 'Pages'
}
export type XPages = { Type: 'Pages'; Kids: PDFRef[] }

export function isXPage(value: unknown): value is XPage {
  if (typeof value !== 'object') return false
  if (value === null) return false
  return hasOwnProperty(value, 'Type') && value['Type'] === 'Page'
}
export type XPage = {
  Type: 'Page'
  Resources: PDFObjectWithRefs
  Contents: PDFRef
  MediaBox: number[]
}

export type StreamDict = {
  Object: {
    Dict: { Filter: string; Length: number }
    StreamOffset: number
    StreamLength: number
  }
}

export type XObject =
  | {
      Object: XPage | XPages | PDFObjectWithRefs
    }
  | StreamDict

export interface XRefTable {
  Table: { [key: string]: XObject }
  PageCount: number
  Root: PDFRef
  RootDict: { Pages: PDFRef; OCProperties?: OCProperties }
  Title: string
}

// Orignally inspired by
// https://stackoverflow.com/a/722676
export async function traverse(
  obj: unknown,
  maybeMap: (obj: Record<string, unknown>) => Promise<unknown>
): Promise<unknown> {
  if (Array.isArray(obj)) {
    return Promise.all(obj.map((item) => traverse(item, maybeMap)))
  }
  if (isNonNullObject(obj)) {
    return maybeMap(obj)
  }
  return obj
}

export async function mapObject(
  jsonObj: Record<string, unknown>,
  maybeMap: (obj: Record<string, unknown>) => Promise<unknown>
): Promise<Record<string, unknown>> {
  return Object.fromEntries(
    await Promise.all(Object.entries(jsonObj).map(async ([key, value]) => [key, await traverse(value, maybeMap)]))
  )
}

export type OCProperties = {
  D: {
    ON?: PDFRef[]
    OFF?: PDFRef[]
    Order: PDFRef
    RBGroups: unknown[]
  }
  OCGs: PDFRef[]
}
