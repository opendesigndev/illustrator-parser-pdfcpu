import { chunk } from '../utils/array'
import { Stream } from '../utils/stream'
import { assertNever } from '../utils/types'
import { Delimiter, LexerTokenType, Operand, Operands, OperandType, Range } from './interfaces'

export function intoMap(values: Operands): Map<string, Operand> {
  return new Map(
    chunk(values, 2).map(([key, value]) => {
      if (key.type !== OperandType.Name) {
        throw new Error(`AssertionError: dict key is not a Name, is '${key.type}'`)
      }
      return [key.value, value]
    })
  )
}

type Token = Delimiter | Range
type TokenStream = Stream<Token, ReadonlyArray<Token>>

class EntityParser {
  private isName = false
  private isHexadecimalString = false
  private isDone = false

  constructor(
    private cursor: TokenStream,
    public readonly decoder: TextDecoder,
    private isArray = false,
    private isDict = false
  ) {}

  private child({ isArray = false, isDict = false }: { isArray?: boolean; isDict?: boolean }): EntityParser {
    return new EntityParser(this.cursor, this.decoder, isArray, isDict)
  }

  private parseArray(): Operand {
    const value = Array.from(this.child({ isArray: true }).generate())
    return { type: OperandType.Array, value }
  }

  private parseDict(): Operand {
    const values = Array.from(this.child({ isDict: true }).generate())
    const value = intoMap(values)
    return {
      type: OperandType.Dict,
      value,
    }
  }

  private parseDelimiter(value: string): Operand | undefined {
    switch (value) {
      case '[':
        return this.parseArray()
      case ']':
        if (!this.isArray) throw new Error('AssertionError: array finished before starting?')
        this.isDone = true
        return
      case '<<':
        return this.parseDict()
      case '>>':
        if (!this.isDict) throw new Error('AssertionError: dict finished before starting?')
        this.isDone = true
        return
      case '<':
        if (this.isHexadecimalString) throw new Error('AssertionError: recursive hexadecimal string?')
        this.isHexadecimalString = true
        return
      case '>':
        if (!this.isHexadecimalString) throw new Error('AssertionError: hexadecimal string finished before starting?')
        this.isHexadecimalString = false
        return
      case '/':
        this.isName = true
        return
      default:
        throw new Error(`AssertionError: leftover delimitier: '${value}'`)
    }
  }

  private *parse(op: Token): Generator<Operand> {
    let value
    switch (op.type) {
      case LexerTokenType.Delimiter:
        value = this.parseDelimiter(op.value)
        if (value) yield value
        return
      case LexerTokenType.Range:
        if (this.isHexadecimalString) {
          yield { type: OperandType.HexadecimalString, value: this.decoder.decode(op.value) }
          return
        }
        if (this.isName) {
          this.isName = false
          yield { type: OperandType.Name, value: this.decoder.decode(op.value) }
          return
        }
        // TODO: Add boolean | unparseable
        yield { type: OperandType.Number, value: parseFloat(this.decoder.decode(op.value)) }
        return
      case LexerTokenType.LiteralString:
        yield { type: OperandType.LiteralString, value: op.value }
        return
      case LexerTokenType.Comment:
        return
      default:
        assertNever(op)
    }
  }

  public *generate(): Generator<Operand> {
    let op: Token | undefined
    while ((op = this.cursor.lookahead) && !this.isDone) {
      this.cursor.advance()
      yield* this.parse(op)
    }
  }
}

export class ArgumentParser {
  private cursor: TokenStream

  constructor(tokens: ReadonlyArray<Delimiter | Range>, private decoder: TextDecoder) {
    this.cursor = new Stream(tokens)
  }

  public run(): Operands {
    return Array.from(new EntityParser(this.cursor, this.decoder).generate())
  }
}
