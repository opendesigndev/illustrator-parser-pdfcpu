import { BaseEncoding } from '../src/contents/decoder'
import { readFile } from 'fs/promises'

import { FontReader } from '../src/fonts'

import { test, expect } from 'vitest'

test.skip('parseDifferences: recognizes glyphs from Annex D', async () => {
  // Example from Section 9.6.6 Character Encoding -> 9.6.6.1 General
  const Differences = [
    39,
    'quotesingle',
    96,
    'grave',
    128,
    'Adieresis',
    'Aring',
    'Ccedilla',
    'Eacute',
    'Ntilde',
    'Odieresis',
    'Udieresis',
    'aacute',
    'agrave',
    'acircumflex',
    'adieresis',
    'atilde',
    'aring',
    'ccedilla',
    'eacute',
    'egrave',
    'ecircumflex',
    'edieresis',
    'iacute',
    'igrave',
    'icircumflex',
    'idieresis',
    'ntilde',
    'oacute',
    'ograve',
    'ocircumflex',
    'odieresis',
    'otilde',
    'uacute',
    'ugrave',
    'ucircumflex',
    'udieresis',
    'dagger',
    'degree',
    'cent',
    'sterling',
    'section',
    'bullet',
    'paragraph',
    'germandbls',
    'registered',
    'copyright',
    'trademark',
    'acute',
    'dieresis',
  ]

  const cache = async (_objId: number) => {
    return new Uint8Array()
  }
  const fontReader = new FontReader(cache, new Map())
  const complexEncoding = {
    Encoding: {
      BaseEncoding: 'Identity-H' as BaseEncoding,
      Differences,
    },
    ObjID: 11,
  }
  expect(await fontReader.parse(complexEncoding)).toEqual({
    Encoding: {
      BaseEncoding: 'Identity-H',
      Differences: new Map([
        [39, "'"],
        [96, '`'],
        [128, 'Ä'],
        [129, 'Å'],
        [130, 'Ç'],
        [131, 'É'],
        [132, 'Ñ'],
        [133, 'Ö'],
        [134, 'Ü'],
        [135, 'á'],
        [136, 'à'],
        [137, 'â'],
        [138, 'ä'],
        [139, 'ã'],
        [140, 'å'],
        [141, 'ç'],
        [142, 'é'],
        [143, 'è'],
        [144, 'ê'],
        [145, 'ë'],
        [146, 'í'],
        [147, 'ì'],
        [148, 'î'],
        [149, 'ï'],
        [150, 'ñ'],
        [151, 'ó'],
        [152, 'ò'],
        [153, 'ô'],
        [154, 'ö'],
        [155, 'õ'],
        [156, 'ú'],
        [157, 'ù'],
        [158, 'û'],
        [159, 'ü'],
        [160, '†'],
        [161, '°'],
        [162, '¢'],
        [163, '£'],
        [164, '§'],
        [165, '•'],
        [166, '¶'],
        [167, 'ß'],
        [168, '®'],
        [169, '©'],
        [170, '™'],
        [171, '́'],
        [172, '̈'],
      ]),
    },
    ToUnicode: undefined,
  })
})

// This is related to Type1 fonts and ligatures - see https://github.com/mozilla/pdf.js/blob/898cc2e399e47ae70e08624a72852954030370b0/src/core/glyphlist.js
test.skip('parseDifferences: recognizes missing glyphs', async () => {
  const Differences = [31, 'f_f']

  const cache = async (_objId: number) => {
    return new Uint8Array()
  }
  const fontReader = new FontReader(cache, new Map())
  const complexEncoding = {
    Encoding: {
      BaseEncoding: 'Identity-H' as BaseEncoding,
      Differences,
    },
    ObjID: 11,
  }
  expect(await fontReader.parse(complexEncoding)).toEqual({
    Encoding: {
      BaseEncoding: 'Identity-H',
      Differences: new Map([[31, '\ufffd']]),
    },
    ToUnicode: undefined,
  })
})

test('parseToUnicode: correctly parses CMap', async () => {
  const cache = async (_objId: number) => {
    return readFile(`${__dirname}/fixtures/cmap.txt`)
  }
  const fontReader = new FontReader(cache, new Map())
  const complexEncoding = {
    Encoding: 'Identity-H' as BaseEncoding,
    ToUnicode: {
      ObjID: 12,
    },
    ObjID: 11,
  }
  expect(await fontReader.parse(complexEncoding)).toEqual({
    Encoding: 'Identity-H',
    ToUnicode: new Map([[14929, '\u{2003E}']]),
  })
})
