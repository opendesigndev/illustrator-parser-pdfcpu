import { BaseEncoding } from '../decoder'
import { EscapeSequenceParser } from './escape-sequence-parser'

// https://stackoverflow.com/a/4129920/18355339
const encodings = {
  // Windows code page 1252 Western European
  WinAnsiEncoding:
    '\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\x0c\r\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f\u20ac\ufffd\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\ufffd\u017d\ufffd\ufffd\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\ufffd\u017e\u0178\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff',
  'Identity-H':
    '\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\x0c\r\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f\xa0¡¢£¤¥¦§¨©ª«¬\xad®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ',
}

type DerivedEncoding = {
  BaseEncoding: BaseEncoding
  Differences: Map<number, string>
}
export type Encoding = 'WinAnsiEncoding' | 'Identity-H' | DerivedEncoding

export type Font = {
  Encoding: Encoding
  ToUnicode?: Map<number, string>
}

export function decodeWithEncoding(enc: Encoding, code: number): string {
  // 9.6.6 Character Encoding
  if (!enc) {
    console.warn({ enc, code }, 'is undefined?')

    return String.fromCharCode(code)
  }
  if (typeof enc === 'string') return encodings[enc].charAt(code)
  return enc.Differences.get(code) ?? decodeWithEncoding(enc.BaseEncoding, code)
}

export function decode(font: Font, code: number): string {
  // 9.6.6 Character Encoding
  return font.ToUnicode?.get(code) ?? decodeWithEncoding(font.Encoding, code)
}

export function parseEscapeSeqs(font: Font, text: string): string {
  return new EscapeSequenceParser(text, (char) => decode(font, char)).parse()
}

export function parseHexadecimal(font: Font, text: string): string {
  const txtChunks: string[] = []
  if (font.ToUnicode) {
    const matches = text.match(/(....?)/g)
    if (matches) {
      matches.forEach((pair) => {
        if (pair.length !== 4) for (let i = pair.length; i <= 4; i += 1) pair = pair + '0'
        const dec = parseInt(pair, 16)
        const val = decode(font, dec)
        txtChunks.push(val)
      })
    } else {
      console.warn('no text matched pattern in ToUnicode decoding; maybe variable length needs to be implemented')
    }
  } else {
    const matches = text.match(/(..?)/g)
    if (matches) {
      matches.forEach((pair) => {
        if (pair.length !== 2) pair = pair + '0'
        const dec = parseInt(pair, 16)
        const val = decode(font, dec)
        txtChunks.push(val)
      })
    } else {
      console.warn('no text matched pattern in hexadecimal string')
    }
  }
  return txtChunks.join('')
}
