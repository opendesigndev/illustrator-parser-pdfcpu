import { Operands } from '../syntax/interfaces'
import { OperatorParser } from '../syntax/parser'
import { ColorSpace } from './colors'
import { FontRef } from './decoder'

// This module is a poor man ADT implementation
// constructors for each type is a record from name of type into function that creates given type
// "name" value should be consistent with the key

// Extract types from Record (as union of record types)
// eslint-disable-next-line
export type CtorTypes<T> = T extends Record<any, (...args: any) => infer R> ? R : never

export const GraphicStateOperators = {
  // no operands
  q: () => ({ name: 'q' } as const),
  // no operands
  Q: () => ({ name: 'Q' } as const),
  // a b c d e f
  cm: ({ args }: { args: Operands }) => ({ name: 'cm', args } as const),
  // lineWidth
  w: ({ args }: { args: Operands }) => ({ name: 'w', args } as const),
  // lineCap
  J: ({ args }: { args: Operands }) => ({ name: 'J', args } as const),
  // lineJoin
  j: ({ args }: { args: Operands }) => ({ name: 'j', args } as const),
  // miterLimit
  M: ({ args }: { args: Operands }) => ({ name: 'M', args } as const),
  // dashArray dashPhase
  d: ({ args }: { args: Operands }) => ({ name: 'd', args } as const),
  // intent
  ri: ({ args }: { args: Operands }) => ({ name: 'ri', args } as const),
  // flatness
  i: ({ args }: { args: Operands }) => ({ name: 'i', args } as const),
  // dictName
  gs: ({ args }: { args: Operands }) => ({ name: 'gs', args } as const),
}
export type GraphicStateOperator = CtorTypes<typeof GraphicStateOperators>

export const PathConstructionOperators = {
  // x y
  m: ({ args }: { args: Operands }) => ({ name: 'm', args } as const),
  // x y
  l: ({ args }: { args: Operands }) => ({ name: 'l', args } as const),
  // x1 y1 x2 y2 x3 y3
  c: ({ args }: { args: Operands }) => ({ name: 'c', args } as const),
  // x2 y2 x3 y3
  v: ({ args }: { args: Operands }) => ({ name: 'v', args } as const),
  // x1 y1 x3 y3
  y: ({ args }: { args: Operands }) => ({ name: 'y', args } as const),
  // no operands
  h: () => ({ name: 'h' } as const),
  // x y width height
  re: ({ args }: { args: Operands }) => ({ name: 're', args } as const),
}
export type PathConstructionOperator = CtorTypes<typeof PathConstructionOperators>

// All of them have no operands
export const PathPaintingOperators = {
  S: () => ({ name: 'S' } as const),
  s: () => ({ name: 's' } as const),
  f: () => ({ name: 'f' } as const),
  F: () => ({ name: 'F' } as const),
  'f*': () => ({ name: 'f*' } as const),
  B: () => ({ name: 'B' } as const),
  'B*': () => ({ name: 'B*' } as const),
  b: () => ({ name: 'b' } as const),
  'b*': () => ({ name: 'b*' } as const),
  n: () => ({ name: 'n' } as const),
}
export type PathPaintingOperator = CtorTypes<typeof PathPaintingOperators>

// All of them have no operands
export const ClippingPathOperators = {
  W: () => ({ name: 'W' } as const),
  'W*': () => ({ name: 'W*' } as const),
}
export type ClippingPathOperator = CtorTypes<typeof ClippingPathOperators>

// All of them have no operands
export const TextObjectOperators = {
  BT: () => ({ name: 'BT' } as const),
  ET: () => ({ name: 'ET' } as const),
}
export type TextObjectOperator = CtorTypes<typeof TextObjectOperators>

export const TextPositioningOperators = {
  // tx ty
  Td: ({ args }: { args: Operands }) => ({ name: 'Td', args } as const),
  // tx ty
  TD: ({ args }: { args: Operands }) => ({ name: 'TD', args } as const),
  // a b c d e f
  Tm: ({ args }: { args: Operands }) => ({ name: 'Tm', args } as const),
  // no operands
  'T*': () => ({ name: 'T*' } as const),
}
export type TextPositioningOperator = CtorTypes<typeof TextPositioningOperators>

export const TextShowingOperators = {
  // string
  Tj: ({ args }: { args: Operands }) => ({ name: 'Tj', args } as const),
  // string
  "'": ({ args }: { args: Operands }) => ({ name: "'", args } as const),
  // aw ac string
  '"': ({ args }: { args: Operands }) => ({ name: '"', args } as const),
  // array
  TJ: ({ args }: { args: Operands }) => ({ name: 'TJ', args } as const),
}
export type TextShowingOperator = CtorTypes<typeof TextShowingOperators>

export const Type3FontOperators = {
  // wx wy
  d0: ({ args }: { args: Operands }) => ({ name: 'd0', args } as const),
  // wx wy llx lly urx ury
  d1: ({ args }: { args: Operands }) => ({ name: 'd1', args } as const),
}
export type Type3FontOperators = CtorTypes<typeof Type3FontOperators>

export const ColourOperators = {
  // name
  CS: ({ args }: { args: Operands }) => ({ name: 'CS', args } as const),
  // name
  cs: ({ args }: { args: Operands }) => ({ name: 'cs', args } as const),
  // c1...cn
  SC: ({ args }: { args: Operands }) => ({ name: 'SC', args } as const),
  // c1...cn | c1..cn name
  SCN: ({ args }: { args: Operands }) => ({ name: 'SCN', args } as const),
  // c1...cn
  sc: ({ args }: { args: Operands }) => ({ name: 'sc', args } as const),
  // c1...cn | c1..cn name
  scn: ({ args }: { args: Operands }) => ({ name: 'scn', args } as const),
  // gray
  G: ({ args }: { args: Operands }) => ({ name: 'G', args } as const),
  // gray
  g: ({ args }: { args: Operands }) => ({ name: 'g', args } as const),
  // r g b
  RG: ({ args }: { args: Operands }) => ({ name: 'RG', args } as const),
  // r g b
  rg: ({ args }: { args: Operands }) => ({ name: 'rg', args } as const),
  // c m y k
  K: ({ args }: { args: Operands }) => ({ name: 'K', args } as const),
  // c m y k
  k: ({ args }: { args: Operands }) => ({ name: 'k', args } as const),
}
export type ColourOperator = CtorTypes<typeof ColourOperators>

export const ShadingOperators = {
  // name
  sh: ({ args }: { args: Operands }) => ({ name: 'sh', args } as const),
}
export type ShadingOperator = CtorTypes<typeof ShadingOperators>

// All of them have no operands
export const InlineImageOperators = {
  BI: () => ({ name: 'BI' } as const),
  ID: () => ({ name: 'ID' } as const),
  EI: () => ({ name: 'EI' } as const),
}
export type InlineImageOperator = CtorTypes<typeof InlineImageOperators>

export const XObjectOperators = {
  // name
  Do: ({ args }: { args: Operands }) => ({ name: 'Do', args } as const),
}
export type XObjectOperator = CtorTypes<typeof XObjectOperators>

export const MarkedContentOperators = {
  // tag
  MP: ({ args }: { args: Operands }) => ({ name: 'MP', args } as const),
  // tag properties
  DP: ({ args }: { args: Operands }) => ({ name: 'DP', args } as const),
  // tag
  BMC: ({ args }: { args: Operands }) => ({ name: 'BMC', args } as const),
  // tag properties
  BDC: ({ args }: { args: Operands }) => ({ name: 'BDC', args } as const),
  // no operands
  EMC: () => ({ name: 'EMC' } as const),
}
export type MarkedContentOperator = CtorTypes<typeof MarkedContentOperators>

// All of them have no operands
export const CompatibilityOperators = {
  BX: () => ({ name: 'BX' } as const),
  EX: () => ({ name: 'EX' } as const),
}
export type CompatibilityOperator = CtorTypes<typeof CompatibilityOperators>

// Table 105 -> kinda hard to find since it's not mentioned in main table
export const TextStateOperators = {
  // charSpace
  Tc: ({ args }: { args: Operands }) => ({ name: 'Tc', args } as const),
  // wordSpace
  Tw: ({ args }: { args: Operands }) => ({ name: 'Tw', args } as const),
  // scale
  Tz: ({ args }: { args: Operands }) => ({ name: 'Tz', args } as const),
  // leading
  TL: ({ args }: { args: Operands }) => ({ name: 'TL', args } as const),
  // These are two args!
  // font size
  Tf: ({ args }: { args: Operands }) => ({ name: 'Tf', args } as const),
  // render
  Tr: ({ args }: { args: Operands }) => ({ name: 'Tr', args } as const),
  // rise
  Ts: ({ args }: { args: Operands }) => ({ name: 'Ts', args } as const),
}
export type TextStateOperator = CtorTypes<typeof TextStateOperators>

export const ContentStreamOperators = {
  ...GraphicStateOperators,
  ...PathConstructionOperators,
  ...PathPaintingOperators,
  ...ClippingPathOperators,
  ...TextObjectOperators,
  ...TextPositioningOperators,
  ...TextShowingOperators,
  ...Type3FontOperators,
  ...ColourOperators,
  ...ShadingOperators,
  ...InlineImageOperators,
  ...XObjectOperators,
  ...MarkedContentOperators,
  ...CompatibilityOperators,
  ...TextStateOperators,
}
type Operator = keyof typeof ContentStreamOperators
export type ContentStreamOperator = CtorTypes<typeof ContentStreamOperators>

export const parseOperators = (data: Uint8Array) =>
  new OperatorParser<Operator, ContentStreamOperator>(data, ContentStreamOperators).parse()

export type Resources = {
  readonly ColorSpace: Record<string, ColorSpace>
  readonly ExtGState: Record<string, unknown>
  readonly Font: Record<string, FontRef>
}
