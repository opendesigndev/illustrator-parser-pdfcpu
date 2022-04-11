import { unshift } from '../src/utils/stream'

import { test, expect } from 'vitest'

function* generatorOf(arr: number[]): Generator<number> {
  for (const a of arr) {
    yield a
  }
}

// this works:
function takeN(n: number, xs: Generator<number>): number[] {
  let idx = 0
  const ret = []
  while (true) {
    const next = xs.next()
    ret.push(next.value)
    idx += 1
    if (idx === n) break
  }
  return ret
}
// this doesn't:
// function takeN(n: number, xs: Generator<number>): number[] {
//     let idx = 0
//     const ret = []
//     for (const x of xs) {
//         ret.push(x)
//         idx += 1
//         if (idx === n) break
//     }
//     return ret
// }

test('unshift: adds new value to stream', () => {
  expect(Array.from(unshift(0, generatorOf([1, 2, 3])))).toEqual([0, 1, 2, 3])
})

test('unshift: combines with other operators', () => {
  const gen = generatorOf([1, 2, 3])
  const with0 = unshift(0, gen)
  expect(Array.from(takeN(2, with0))).toEqual([0, 1])
  expect(Array.from(takeN(2, gen))).toEqual([2, 3])
})

test('streams combine with other operators', () => {
  const gen = generatorOf([0, 1, 2, 3])
  expect(Array.from(takeN(2, gen))).toEqual([0, 1])
  expect(Array.from(takeN(2, gen))).toEqual([2, 3])
})
