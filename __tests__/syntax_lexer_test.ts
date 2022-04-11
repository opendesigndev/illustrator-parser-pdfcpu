import { readFile } from 'fs/promises'
import { LexerTokenType } from '../src/syntax/interfaces'
import { Lexer } from '../src/syntax/lexer'

import { test, expect } from 'vitest'

const tokenize = (data: Uint8Array) => new Lexer(data).tokenize()

test('tokenize: recognizes whitespace', () => {
  expect(Array.from(tokenize(new TextEncoder().encode('    ')))).toEqual([
    { type: LexerTokenType.Whitespace, isEOL: false },
  ])
})

test('tokenize: recognizes \\n', () => {
  expect(Array.from(tokenize(new TextEncoder().encode('\n')))).toEqual([
    { type: LexerTokenType.Whitespace, isEOL: true },
  ])
})

test('tokenize: recognizes \\r\\n', () => {
  expect(Array.from(tokenize(new TextEncoder().encode('\r\n')))).toEqual([
    { type: LexerTokenType.Whitespace, isEOL: true },
  ])
})

test('tokenize: recognizes delimiter', () => {
  expect(Array.from(tokenize(new TextEncoder().encode('[')))).toEqual([{ type: LexerTokenType.Delimiter, value: '[' }])
})

test('tokenize: recognizes text', () => {
  expect(Array.from(tokenize(new TextEncoder().encode('aaaa')))).toEqual([
    { type: LexerTokenType.Range, startsAt: 0, endsAt: 4, line: 1, value: new Uint8Array([97, 97, 97, 97]) },
  ])
})

test('tokenize: works for fixtures', async () => {
  expect(async () => Array.from(tokenize(await readFile(`${__dirname}/fixtures/one.json_26`)))).not.toThrowError()
  expect(async () => Array.from(tokenize(await readFile(`${__dirname}/fixtures/one.json_29`)))).not.toThrowError()
  expect(async () =>
    Array.from(tokenize(await readFile(`${__dirname}/fixtures/VectorApple.json_6`)))
  ).not.toThrowError()
})

test('tokenize: recognizes literal strings', () => {
  expect(Array.from(tokenize(new TextEncoder().encode('(This is a string)')))).toEqual([
    {
      type: LexerTokenType.LiteralString,
      startsAt: 0,
      endsAt: 18,
      line: 1,
      value: new Uint8Array([84, 104, 105, 115, 32, 105, 115, 32, 97, 32, 115, 116, 114, 105, 110, 103]),
    },
  ])
  expect(Array.from(tokenize(new TextEncoder().encode('(Strings may contain newlines\n and such.)')))).toEqual([
    {
      type: LexerTokenType.LiteralString,
      startsAt: 0,
      endsAt: 41,
      line: 1,
      value: new Uint8Array([
        83, 116, 114, 105, 110, 103, 115, 32, 109, 97, 121, 32, 99, 111, 110, 116, 97, 105, 110, 32, 110, 101, 119, 108,
        105, 110, 101, 115, 10, 32, 97, 110, 100, 32, 115, 117, 99, 104, 46,
      ]),
    },
  ])
  expect(
    Array.from(
      tokenize(
        new TextEncoder().encode(
          '(Strings may contain balanced parentheses ( ) and\n special characters (*!&}^% and so on).)'
        )
      )
    )
  ).toEqual([
    {
      type: LexerTokenType.LiteralString,
      startsAt: 0,
      endsAt: 90,
      line: 1,
      value: new Uint8Array([
        83, 116, 114, 105, 110, 103, 115, 32, 109, 97, 121, 32, 99, 111, 110, 116, 97, 105, 110, 32, 98, 97, 108, 97,
        110, 99, 101, 100, 32, 112, 97, 114, 101, 110, 116, 104, 101, 115, 101, 115, 32, 40, 32, 41, 32, 97, 110, 100,
        10, 32, 115, 112, 101, 99, 105, 97, 108, 32, 99, 104, 97, 114, 97, 99, 116, 101, 114, 115, 32, 40, 42, 33, 38,
        125, 94, 37, 32, 97, 110, 100, 32, 115, 111, 32, 111, 110, 41, 46,
      ]),
    },
  ])
  // The following is an empty string
  expect(Array.from(tokenize(new TextEncoder().encode('()')))).toEqual([
    {
      type: LexerTokenType.LiteralString,
      startsAt: 0,
      endsAt: 2,
      line: 1,
      value: new Uint8Array([]),
    },
  ])
  expect(
    Array.from(tokenize(new TextEncoder().encode('(Strings may contain escaped unbalanced parantheses: \\) .)')))
  ).toEqual([
    {
      type: LexerTokenType.LiteralString,
      startsAt: 0,
      endsAt: 58,
      line: 1,
      value: new Uint8Array([
        83, 116, 114, 105, 110, 103, 115, 32, 109, 97, 121, 32, 99, 111, 110, 116, 97, 105, 110, 32, 101, 115, 99, 97,
        112, 101, 100, 32, 117, 110, 98, 97, 108, 97, 110, 99, 101, 100, 32, 112, 97, 114, 97, 110, 116, 104, 101, 115,
        101, 115, 58, 32, 92, 41, 32, 46,
      ]),
    },
  ])
  expect(
    Array.from(tokenize(new TextEncoder().encode('(Strings may contain escaped unbalanced parantheses: \\( .)()')))
  ).toEqual([
    {
      type: LexerTokenType.LiteralString,
      startsAt: 0,
      endsAt: 58,
      line: 1,
      value: new Uint8Array([
        83, 116, 114, 105, 110, 103, 115, 32, 109, 97, 121, 32, 99, 111, 110, 116, 97, 105, 110, 32, 101, 115, 99, 97,
        112, 101, 100, 32, 117, 110, 98, 97, 108, 97, 110, 99, 101, 100, 32, 112, 97, 114, 97, 110, 116, 104, 101, 115,
        101, 115, 58, 32, 92, 40, 32, 46,
      ]),
    },
    {
      type: LexerTokenType.LiteralString,
      startsAt: 58,
      endsAt: 60,
      line: 1,
      value: new Uint8Array([]),
    },
  ])
  expect(
    Array.from(tokenize(new TextEncoder().encode('(This is a \n string)(this is a string on a new line)')))
  ).toEqual([
    {
      type: LexerTokenType.LiteralString,
      startsAt: 0,
      endsAt: 20,
      line: 1,
      value: new Uint8Array([84, 104, 105, 115, 32, 105, 115, 32, 97, 32, 10, 32, 115, 116, 114, 105, 110, 103]),
    },
    {
      type: LexerTokenType.LiteralString,
      startsAt: 20,
      endsAt: 52,
      line: 2,
      value: new Uint8Array([
        116, 104, 105, 115, 32, 105, 115, 32, 97, 32, 115, 116, 114, 105, 110, 103, 32, 111, 110, 32, 97, 32, 110, 101,
        119, 32, 108, 105, 110, 101,
      ]),
    },
  ])
})

test('tokenize: recognizes comments', () => {
  expect(Array.from(tokenize(new TextEncoder().encode('abc% comment ( /%) blah blah blah\n123')))).toEqual([
    {
      type: LexerTokenType.Range,
      startsAt: 0,
      endsAt: 3,
      line: 1,
      value: new Uint8Array([97, 98, 99]),
    }, // abc
    {
      type: LexerTokenType.Comment,
      startsAt: 3,
      endsAt: 33,
      line: 1,
      value: new Uint8Array([
        37, 32, 99, 111, 109, 109, 101, 110, 116, 32, 40, 32, 47, 37, 41, 32, 98, 108, 97, 104, 32, 98, 108, 97, 104,
        32, 98, 108, 97, 104,
      ]),
    },
    { type: LexerTokenType.Whitespace, isEOL: true },
    {
      type: LexerTokenType.Range,
      startsAt: 34,
      endsAt: 37,
      line: 2,
      value: new Uint8Array([49, 50, 51]),
    }, // 123
  ])
  expect(Array.from(tokenize(new TextEncoder().encode('%  ')))).toEqual([
    {
      type: LexerTokenType.Comment,
      startsAt: 0,
      endsAt: 3,
      line: 1,
      value: new Uint8Array([37, 32, 32]),
    },
  ])
})
