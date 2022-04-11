export function* unshift<A>(a: A, as: Generator<A>): Generator<A> {
  yield a
  for (const a of as) {
    yield a
  }
}

// https://github.com/achingbrain/it/blob/master/packages/it-all/index.js
export async function all<T>(source: AsyncIterable<T> | Iterable<T>) {
  const arr = []

  for await (const entry of source) {
    arr.push(entry)
  }

  return arr
}

interface Indexable<V> {
  [k: number]: V
  length: number
}
export class Stream<V, T extends Indexable<V>> {
  private _position = 0

  constructor(public readonly stream: T) {}

  public get lookahead(): V | undefined {
    return this.stream[this.position]
  }

  public advance() {
    this._position += 1
  }

  public get position(): number {
    return this._position
  }
}
