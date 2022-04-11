// From @ahejlsberg PR https://github.com/microsoft/TypeScript/pull/40002
type TupleOf<T, N extends number> = N extends N ? (number extends N ? T[] : _TupleOf<T, N, []>) : never
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>

export function chunk<T, K extends number>(arr: readonly T[], elems: K): TupleOf<T, K>[] {
  return Array.from({ length: Math.ceil(arr.length / elems) }).map((_, index) => {
    return arr.slice(index * elems, (index + 1) * elems) as TupleOf<T, K>
  })
}
