import { parseOperators } from '../src/contents/interfaces'
import { OperandType } from '../src/syntax/interfaces'

import { test, expect } from 'vitest'

const encoder = new TextEncoder()

test('parseOperators: recognizes MarkedContent', () => {
  expect(Array.from(parseOperators(encoder.encode(' /OC /MC0 BDC  \n')))).toEqual([
    {
      name: 'BDC',
      args: [
        { type: OperandType.Name, value: 'OC' },
        { type: OperandType.Name, value: 'MC0' },
      ],
    },
  ])
})
