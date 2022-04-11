import { Font, parseEscapeSeqs, parseHexadecimal } from './text-encoding'
import { Operands, OperandType, Operand } from '../syntax/interfaces'
import { assertNever } from '../utils/types'

export enum DecodeType {
  MultiNumber = 'number₁...numberₙ',
  Pattern = 'c₁...cₙ name',
}

export type Differences = (string | number)[]

export type BaseEncoding = 'WinAnsiEncoding' | 'Identity-H'

type DerivedEncodingRef = {
  BaseEncoding: BaseEncoding
  Differences: Differences
}

export type EncodingRef = BaseEncoding | DerivedEncodingRef

export interface FontRef {
  ObjID: number
  Encoding: EncodingRef
  ToUnicode?: { ObjID: number }
}

export interface FontReader {
  get: (id: FontRef) => Promise<Font>
}

export function* decodeNames(from: Operands): Generator<string> {
  for (const op of from) {
    switch (op.type) {
      case OperandType.Name:
        yield op.value
        continue
      default:
        throw new Error(`AssertionError: bogus operand '${op.type}' in decodeNames`)
    }
  }
}

export function decodeName(from: Operands): string {
  const [name] = Array.from(decodeNames(from))
  return name
}

export function* decodeNumbers(from: Operands): Generator<number> {
  for (const op of from) {
    switch (op.type) {
      case OperandType.Number:
        yield op.value
        continue
      default:
        throw new Error(`AssertionError: bogus operand '${op.type}' in decodeNumbers`)
    }
  }
}

export function decodeNumber(from: Operands): number {
  const [num] = Array.from(decodeNumbers(from))
  return num
}

export function* decodeDashPattern(from: Operands): Generator<number | number[]> {
  for (const op of from) {
    switch (op.type) {
      case OperandType.Array:
        op.value.forEach((val: Operand) => {
          if (val.type !== OperandType.Number) {
            throw new Error(`AssertionError: bogus operand '${val.type}' in DashPattern array`)
          }
        })
        yield op.value.map(({ value }: Operand) => value) as number[]
        continue
      case OperandType.Number:
        yield op.value
        continue
      default:
        throw new Error(`AssertionError: bogus operand '${op.type}' in DashPattern`)
    }
  }
}

function* decodePattern(from: Operands): Generator<number | string> {
  for (const val of from.slice(0, -2)) {
    if (val.type !== OperandType.Number) {
      throw new Error(`AssertionError: bogus operand '${val.type}' in decodePattern`)
    }
    yield val.value
  }
  const [last] = from.slice(-1)
  if (last) {
    if (last.type !== OperandType.Name) {
      throw new Error(`AssertionError: bogus operand '${last.type}' in decodePattern last argument`)
    }
    yield last.value
  } else {
    console.warn('empty argument array given to Pattern')
  }
}

export function decode(decls: DecodeType, from: Operands): Generator<number | string> {
  switch (decls) {
    case DecodeType.Pattern:
      return decodePattern(from)
    case DecodeType.MultiNumber:
      return decodeNumbers(from)
    default:
      assertNever(decls)
  }
}

export class Decoder {
  readonly fontReader: FontReader
  private decoder = new TextDecoder()

  constructor(fontReader: FontReader) {
    this.fontReader = fontReader
  }

  async *decodeText(fontId: FontRef, from: Operands): AsyncGenerator<string> {
    const font = await this.fontReader.get(fontId)
    for (const op of from) {
      switch (op.type) {
        case OperandType.LiteralString:
          yield parseEscapeSeqs(font, this.decoder.decode(op.value))
          continue
        case OperandType.HexadecimalString:
          yield parseHexadecimal(font, op.value)
          continue
        default:
          throw new Error(`AssertionError: bogus operand '${op.type}' in decodeText`)
      }
    }
  }

  async *decodeIndividualGlyphPositioning(fontId: FontRef, from: Operands): AsyncGenerator<string | number> {
    const font = await this.fontReader.get(fontId)
    const [arr] = from
    if (arr.type !== OperandType.Array) {
      throw new Error(`AssertionError: TJ argument '${arr.type}' is not an array`)
    }
    for (const op of arr.value) {
      switch (op.type) {
        case OperandType.LiteralString:
          yield parseEscapeSeqs(font, this.decoder.decode(op.value))
          continue
        case OperandType.HexadecimalString:
          yield parseHexadecimal(font, op.value)
          continue
        case OperandType.Number:
          yield op.value
          continue
        default:
          throw new Error(`AssertionError: bogus operand '${op.type}' in decodeIndividualGlyphPositioning`)
      }
    }
  }
}
