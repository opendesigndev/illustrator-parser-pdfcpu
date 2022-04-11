import { EscapeSequence, escapeSequences } from '../../syntax/strings'

export class EscapeSequenceParser {
  private readonly sequences: Generator<EscapeSequence<string>>

  constructor(text: string, private readonly decode: (char: number) => string) {
    this.sequences = escapeSequences(text, '\\')
  }

  public parse(): string {
    return Array.from(this.sequences)
      .map((val) => {
        if (!val.escaped) return val.text
        const parser = new SingleEscapeSequenceParser(val, this.decode)
        return parser.parse() + parser.leftover
      })
      .join('')
  }
}

// TABLE 3 – Escape sequences in literal strings
const EscapedCharactersMap = new Map([
  ['\n', null],
  ['\r', null],
  ['n', '\n'],
  ['r', '\r'],
  ['t', '\t'],
  ['b', '\b'],
  ['f', '\f'],
  ['(', '('],
  [')', ')'],
  ['\\', '\\'],
])
class SingleEscapeSequenceParser {
  private position = 0
  constructor(private readonly val: EscapeSequence<string>, private readonly decode: (char: number) => string) {}

  public parse(): string {
    const escapedCharacter = this.val.text[0]
    if (EscapedCharactersMap.has(escapedCharacter)) {
      this.position += 1
      return EscapedCharactersMap.get(escapedCharacter) ?? ''
    } else if (/\d/.test(escapedCharacter)) {
      // \ddd case
      return this.parseOctalSequence()
    } else {
      throw new Error("AssertionError: invalid escape sequence '\\${val.text}'")
    }
  }

  public get leftover(): string {
    return this.val.text.slice(this.position, this.val.text.length)
  }

  private parseOctalSequence(): string {
    const ddd = this.val.text.slice(0, 3)
    let octal = ''
    // The number ddd may consist of one, two, or three octal digits; high-order overflow shall be ignored. Three octal
    // digits shall be used, with leading zeros as needed, if the next character of the string is also a digit.
    if (/\d{3}/.test(ddd)) {
      octal = ddd
      this.position += 3
    } else if (/\d{2}/.test(ddd)) {
      octal = ddd.slice(0, 2)
      this.position += 2
    } else {
      octal = ddd[0]
      this.position += 1
    }
    return this.decode(parseInt(octal, 8))
  }
}
