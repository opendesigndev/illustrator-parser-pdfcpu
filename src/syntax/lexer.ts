import { Stream } from '../utils/stream'
import { LexerToken, LexerTokenType } from './interfaces'

// 7.2 - Lexical Conventions
const EOLCharacters = new Set<number | undefined>([10, 13])
const WhitespaceCharacters = new Set<number | undefined>([0, 9, 12, 32])

const Delimiters = {
  '(': '('.charCodeAt(0),
  ')': ')'.charCodeAt(0),
  '%': '%'.charCodeAt(0),
  '<': '<'.charCodeAt(0),
  '>': '>'.charCodeAt(0),
}

const REVERSE_SOLIDUS = '\\'.charCodeAt(0)

const DelimiterCharacters = new Set<number | undefined>([
  // ( 40 28 50 LEFT PARENTHESIS
  40,
  // ) 41 29 51 RIGHT PARENTHESIS
  41,
  // < 60 3C 60 LESS-THAN SIGN
  60,
  // > 62 3E 62 GREATER-THAN SIGN
  62,
  // [ 91 5B 133 LEFT SQUARE BRACKET
  91,
  // ] 93 5D 135 RIGHT SQUARE BRACKET
  93,
  // { 123 7B 173 LEFT CURLY BRACKET
  123,
  // } 125 7D 175 RIGHT CURLY BRACKET
  125,
  // / 47 2F 57 SOLIDUS
  47,
  // % 37 25 45 PERCENT SIGN
  37,
])

type CharacterStream = Stream<number, Uint8Array>

export class Lexer {
  private line = 1
  private cursor: CharacterStream

  constructor(data: Uint8Array) {
    this.cursor = new Stream<number, Uint8Array>(data)
  }

  *tokenize(): Generator<LexerToken> {
    let val: number | undefined
    while ((val = this.cursor.lookahead) !== undefined) {
      if (WhitespaceCharacters.has(val)) {
        yield this.gobbleWhitespace()
        continue
      }
      if (EOLCharacters.has(val)) {
        yield this.gobbleEOL()
        continue
      }
      if (DelimiterCharacters.has(val)) {
        yield this.handleDelimiter(val)
        continue
      }
      yield this.gobbleRange()
    }
  }

  private handleDelimiter(val: number): LexerToken {
    switch (val) {
      case Delimiters['%']:
        return this.gobbleComment()
      case Delimiters['(']:
        return this.gobbleLiteralString()
      case Delimiters['<']:
      case Delimiters['>']:
        this.cursor.advance()
        if (val === this.cursor.lookahead) {
          this.cursor.advance()
          return { type: LexerTokenType.Delimiter, value: String.fromCharCode(val, val) }
        }
        return { type: LexerTokenType.Delimiter, value: String.fromCharCode(val) }
      default:
        this.cursor.advance()
        return { type: LexerTokenType.Delimiter, value: String.fromCharCode(val) }
    }
  }

  private gobbleEOL(): LexerToken {
    const val = this.cursor.lookahead
    this.cursor.advance()
    // The combination of a CARRIAGE RETURN followed immediately by a LINE FEED shall be treated as one EOL marker.
    if (val === 13 && this.cursor.lookahead === 10) this.cursor.advance()
    this.line += 1
    return { type: LexerTokenType.Whitespace, isEOL: true }
  }

  private gobbleWhitespace(): LexerToken {
    while (WhitespaceCharacters.has(this.cursor.lookahead)) this.cursor.advance()
    return { type: LexerTokenType.Whitespace, isEOL: false }
  }

  private gobbleLiteralString(): LexerToken {
    const startsAt = this.cursor.position
    const line = this.line
    let open = 1 // data[position] == (
    this.cursor.advance()
    let val: number | undefined
    while ((val = this.cursor.lookahead) !== undefined && open > 0) {
      if (val === REVERSE_SOLIDUS) this.cursor.advance()
      if (val === Delimiters['(']) open += 1
      if (val === Delimiters[')']) open -= 1
      if (EOLCharacters.has(val)) this.line += 1
      this.cursor.advance()
    }
    const endsAt = this.cursor.position
    return {
      type: LexerTokenType.LiteralString,
      value: this.cursor.stream.slice(startsAt + 1, endsAt - 1),
      startsAt,
      endsAt,
      line,
    }
  }

  private gobbleComment(): LexerToken {
    const startsAt = this.cursor.position
    let val: number | undefined
    while ((val = this.cursor.lookahead) !== undefined && !EOLCharacters.has(val)) this.cursor.advance()
    const endsAt = this.cursor.position
    return {
      type: LexerTokenType.Comment,
      value: this.cursor.stream.slice(startsAt, endsAt),
      startsAt,
      endsAt,
      line: this.line,
    }
  }

  private gobbleRange(): LexerToken {
    const startsAt = this.cursor.position
    let val: number | undefined
    while (
      (val = this.cursor.lookahead) !== undefined &&
      !DelimiterCharacters.has(val) &&
      !EOLCharacters.has(val) &&
      !WhitespaceCharacters.has(val)
    ) {
      this.cursor.advance()
    }
    const endsAt = this.cursor.position
    return {
      type: LexerTokenType.Range,
      value: this.cursor.stream.slice(startsAt, endsAt),
      startsAt,
      endsAt,
      line: this.line,
    }
  }
}
