export function hasOwnProperty<K extends string>(obj: unknown, prop: K): obj is Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

//  '_' is defined but never used  @typescript-eslint/no-unused-vars
// eslint-disable-next-line
export function assertNever(op: never): never {
  throw new Error('Assertion Error: unreachable code')
}

export function isNonNullObject(val: unknown): val is Record<string | number, unknown> {
  return val !== null && typeof val === 'object'
}
