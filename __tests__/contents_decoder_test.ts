import { parseEscapeSeqs, parseHexadecimal } from '../src/contents/text-encoding'

import { test, expect } from 'vitest'

const testFont = {
  Encoding: 'Identity-H',
} as const

test('parseEscapeSeqs: recognizes no escape sequences', () => {
  expect(parseEscapeSeqs(testFont, 'These two strings are the same . ')).toEqual('These two strings are the same . ')
})

test('parseEscapeSeqs: recognizes escape newline sequences', () => {
  expect(parseEscapeSeqs(testFont, 'These \\\ntwo strings \\\nare the same . ')).toEqual(
    'These two strings are the same . '
  )
  expect(parseEscapeSeqs(testFont, 'These \\\rtwo strings \\\rare the same . ')).toEqual(
    'These two strings are the same . '
  )
})

test('parseEscapeSeqs: recognizes simple escape sequences', () => {
  expect(parseEscapeSeqs(testFont, '\\n')).toEqual('\n')
  expect(parseEscapeSeqs(testFont, '\\r')).toEqual('\r')
  expect(parseEscapeSeqs(testFont, '\\t')).toEqual('\t')
  expect(parseEscapeSeqs(testFont, '\\f')).toEqual('\f')
  expect(parseEscapeSeqs(testFont, '\\(')).toEqual('(')
  expect(parseEscapeSeqs(testFont, '\\)')).toEqual(')')
  expect(parseEscapeSeqs(testFont, '\\\\')).toEqual('\\')
})

test('parseEscapeSeqs: recognizes unicode escape sequences', () => {
  expect(parseEscapeSeqs(testFont, '\\053')).toEqual('+')
  expect(parseEscapeSeqs(testFont, '\\53')).toEqual('+')
  expect(parseEscapeSeqs(testFont, '\\0')).toEqual('\u0000')
  expect(parseEscapeSeqs(testFont, '\\0003')).toEqual('\u00003')
})

test('parseHexadecimal: works for simple encoding', () => {
  expect(parseHexadecimal(testFont, '74657374')).toEqual('test')
  expect(parseHexadecimal(testFont, '43415')).toEqual('CAP')
})

test('parseHexadecimal: works for ToUnicode encoding', () => {
  const ToUnicodeFont = {
    ToUnicode: new Map([
      [1, 'A'],
      [274, ' '],
      [103, 'a'],
      [115, 'c'],
      [119, 'd'],
      [123, 'e'],
      [132, 'f'],
      [133, 'g'],
      [136, 'h'],
      [137, 'i'],
      [148, 'l'],
      [154, 'm'],
      [155, 'n'],
      [160, 'o'],
      [170, 'p'],
      [173, 'r'],
      [177, 's'],
      [183, 't'],
      [187, 'u'],
      [196, 'v'],
      [197, 'w'],
      [198, 'x'],
      [199, 'y'],
      [207, 'ﬀ'],
    ]),
    Encoding: 'Identity-H',
  } as const
  expect(
    parseHexadecimal(
      ToUnicodeFont,
      '0088006700C4007B0112007B00C600AA007B00AD0089007B009B0073007B0077011200B70088007B0112'
    )
  ).toEqual('have experienced the ')
})

// TODO: Add Decoder test
