import { assertNever } from '../utils/types'

interface Parseable<K, V> {
  indexOf(val: K, from: number): number
  slice(from: number, to: number): V
  length: number
}

type EscapeOrSequence<V> =
  | {
      type: 'text'
      text: V
    }
  | { type: 'escape'; text: V }
function* auxEscapeSequences<K, V, Arr extends Parseable<K, V>>(text: Arr, needle: K): Generator<EscapeOrSequence<V>> {
  let position = 0
  let idx
  while ((idx = text.indexOf(needle, position)) >= 0) {
    if (position < idx) {
      yield { type: 'text', text: text.slice(position, idx) }
    }
    position = idx + 1
    yield { type: 'escape', text: text.slice(idx, idx + 1) }
    idx = text.indexOf(needle, position)
  }
  if (position < text.length) {
    yield { text: text.slice(position, text.length), type: 'text' }
  }
}

export type EscapeSequence<V> = { text: V; escaped: boolean }
export function* escapeSequences<K, V, Arr extends Parseable<K, V>>(
  text: Arr,
  needle: K
): Generator<EscapeSequence<V>> {
  let escaped = false
  for (const val of auxEscapeSequences<K, V, Arr>(text, needle)) {
    if (escaped) {
      yield { text: val.text, escaped }
      escaped = false
      continue
    }
    switch (val.type) {
      case 'escape':
        escaped = true
        break
      case 'text':
        yield { text: val.text, escaped }
        break
      default:
        assertNever(val)
    }
  }
}
