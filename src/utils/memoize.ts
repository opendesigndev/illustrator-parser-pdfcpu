export class Cache<K, V> {
  constructor(private readonly _values: Map<K, V>) {}

  public upsert(key: K, valueFn: () => V): V {
    const set = () => {
      const value = valueFn()
      this._values.set(key, value)
      return value
    }
    return this._values.get(key) ?? set()
  }
}
