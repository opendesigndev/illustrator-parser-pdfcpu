import { readFile } from 'fs/promises'

import { Parser } from '../src/syntax/parser'
import { OperandType, Dict, Array, LiteralString } from '../src/syntax/interfaces'

import { test, expect } from 'vitest'

const parse = (data: Uint8Array) => new Parser(data).parseDict()

test('parser: parses AI structure', async () => {
  const dict = parse(await readFile(`${__dirname}/fixtures/pure_data_structure.ps`)).get('1') as Dict
  expect(dict.type).toEqual(OperandType.Dict)

  const textLayers = dict.value.get('1') as Array
  expect(textLayers.type).toEqual(OperandType.Array)
  const decoder = new TextDecoder('utf-16be')
  const [layer] = textLayers.value.slice(-1)

  const textFrame = decoder.decode(
    (((layer as Dict).value.get('0') as Dict).value.get('0') as LiteralString).value.slice(2)
  )

  expect(textFrame).toEqual(
    'DISCLAIMER: Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod ti ncidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem facilisi.\r\r'
  )
})
