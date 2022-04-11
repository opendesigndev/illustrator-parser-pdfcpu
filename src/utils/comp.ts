export function dot<A, B, C, D>(a: (arg0: A, arg1: C) => D, b: (arg0: A, arg1: B) => C): (k: A, v: B) => D {
  return (k: A, v: B) => a(k, b(k, v))
}

export function dots<A, B>(...args: ((arg0: A, arg1: B) => B)[]): (k: A, v: B) => B {
  let f = (_: A, v: B) => v
  for (const a of args) {
    f = dot(f, a)
  }
  return f
}
