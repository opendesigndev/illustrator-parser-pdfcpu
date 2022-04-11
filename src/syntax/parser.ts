import { assertNever } from '../utils/types'
import { ArgumentParser, intoMap } from './argument-parser'
import { Delimiter, LexerToken, LexerTokenType, Operand, Operands, Range } from './interfaces'
import { Lexer } from './lexer'

type OperatorLookup<K> = Map<number, Set<K>>

function prepareLookup<K extends string>(keys: K[]): OperatorLookup<K> {
  const lookup = new Map()
  keys.forEach((elem) => {
    const len = elem.length
    const base = lookup.get(len) || new Set()
    base.add(elem)
    lookup.set(len, base)
  })
  return lookup
}

export class OperatorParser<K extends string, V> {
  private readonly lookup: OperatorLookup<K>
  private readonly decoder = new TextDecoder()
  private tokens: Generator<LexerToken>

  constructor(data: Uint8Array, private ctors: Record<K, (o: { args: Operands }) => V>) {
    this.tokens = new Lexer(data).tokenize()
    this.lookup = prepareLookup(Object.keys(ctors) as K[])
  }

  private handleRange(token: Range): Range | K {
    const len = token.endsAt - token.startsAt
    const possibleOperators = this.lookup.get(len)
    if (possibleOperators) {
      const value = this.decoder.decode(token.value) as K
      if (possibleOperators.has(value)) {
        return value
      }
    }
    return token
  }

  private *find(): Generator<Delimiter | Range | K> {
    for (const token of this.tokens) {
      switch (token.type) {
        case LexerTokenType.Whitespace:
          continue // whitespace, can be safely ignored at this point
        case LexerTokenType.Range:
          yield this.handleRange(token)
          continue
        case LexerTokenType.Comment:
        case LexerTokenType.LiteralString:
        case LexerTokenType.Delimiter:
          yield token // not interesting, but meaningful, let's pass it on
          continue
        default:
          // make sure we handled all the options
          assertNever(token)
      }
    }
  }

  public *parse(): Generator<V> {
    let args = []
    for (const token of this.find()) {
      if (typeof token === 'string') {
        yield this.ctors[token as K]({ args: new ArgumentParser(args, this.decoder).run() })
        args = []
        continue
      }
      args.push(token)
    }
  }
}

export class Parser {
  private readonly decoder = new TextDecoder()
  private tokens: Generator<LexerToken>

  constructor(data: Uint8Array) {
    this.tokens = new Lexer(data).tokenize()
  }

  public parseDict(): Map<string, Operand> {
    const args = Array.from(this.tokens).filter(
      ({ type }) =>
        type === LexerTokenType.Delimiter || type === LexerTokenType.Range || type === LexerTokenType.LiteralString
    ) as (Delimiter | Range)[]
    const values = new ArgumentParser(args, this.decoder).run()
    return intoMap(values)
  }
}
