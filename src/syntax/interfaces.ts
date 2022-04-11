export enum LexerTokenType {
  Whitespace = 'whitespace',
  Delimiter = 'delimiter',
  LiteralString = 'literal string',
  Comment = 'comment',
  Range = 'range',
}

// String of characters with no special meaning
export type Whitespace = { type: LexerTokenType.Whitespace; isEOL: boolean }

// Characters with special syntactic meaning by themselves
export type Delimiter = {
  type: LexerTokenType.Delimiter
  value: string
}

// Range of characters - may form one syntactic unit (like Comment or Literal string) or be part of greater entity
// e.g. names (/FooBar) are Delimiter '/' followed by a Range 'FooBar' at this point
export type Range = {
  type: LexerTokenType.Range | LexerTokenType.LiteralString | LexerTokenType.Comment
  startsAt: number // inclusive
  endsAt: number // exclusive
  value: Uint8Array

  // metadata
  line: number
}

export type LexerToken = Whitespace | Delimiter | Range

export enum OperandType {
  Number = 'number',
  Name = 'name',
  LiteralString = 'literal string',
  HexadecimalString = 'hexadecimal string',
  Array = 'array',
  Dict = 'dictionary',
}

export type LiteralString = {
  type: OperandType.LiteralString
  value: Uint8Array
}

export type HexadecimalString = {
  type: OperandType.HexadecimalString
  value: string
}

export type Name = {
  type: OperandType.Name
  value: string
}

export type Number = {
  type: OperandType.Number
  value: number
}

export type Array = {
  type: OperandType.Array
  value: Operands
}

export type Dict = {
  type: OperandType.Dict
  value: Map<string, Operand>
}

//  Don't use `Number` as a type. Use number instead  @typescript-eslint/ban-types
// eslint-disable-next-line
export type Operand = LiteralString | HexadecimalString | Name | Number | Array | Dict
export type Operands = ReadonlyArray<Operand>
