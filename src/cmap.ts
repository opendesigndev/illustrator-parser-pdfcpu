import { Operands } from './syntax/interfaces'
import { OperatorParser } from './syntax/parser'

export const CMapOperators = {
  begincodespacerange: () => ({ name: 'begincodespacerange' } as const),
  endcodespacerange: () => ({ name: 'endcodespacerange' } as const),
  beginbfrange: () => ({ name: 'beginbfrange' } as const),
  endbfrange: ({ args }: { args: Operands }) => ({ name: 'endbfrange', args } as const),
  beginbfchar: () => ({ name: 'beginbfchar' } as const),
  endbfchar: ({ args }: { args: Operands }) => ({ name: 'endbfchar', args } as const),
}
type Operator = keyof typeof CMapOperators
type OperatorInstance = ReturnType<typeof CMapOperators[Operator]>

export const parseCMapOperators = (data: Uint8Array) =>
  new OperatorParser<Operator, OperatorInstance>(data, CMapOperators).parse()
