import { dots } from './utils/comp'

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
export function getCircularReplacer(name: string): (_: string, value: unknown) => unknown | null {
  const seen = new WeakSet()
  return (_: string, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        console.warn(`JSON.stringify(${name}) - already seen:`, value)
        return null
      }
      seen.add(value)
    }
    return value
  }
}

export const floatRounder = (_: string, value: unknown) => {
  if (typeof value === 'number') {
    return parseFloat(value.toFixed(0))
  }
  return value
}

export const killImageRefs = (key: string, value: unknown) => {
  if (key === 'Image') {
    return '<omitted image path>'
  }
  return value
}

export const normalizeOCRefs = (key: string, value: unknown) => {
  if (key === 'OCProperties' && typeof value === 'object' && value !== null) {
    const v = value as Record<string, unknown>
    const d = v['D'] as Record<string, unknown>
    if (d) {
      delete d['Order'] // only present in our version
      delete d['RBGroups'] // only present in our version
    }
    delete v['OCGs'] // only present in our version
  }
  return value
}

export const normalizeText = (key: string, value: unknown) => {
  if (key === 'Text') {
    if (typeof value === 'string')
      // const short = value.slice(0, 90) // for some reason Poppler truncates longer strings
      // return short // + '[' + Array.from(short).map((_, idx) => value.codePointAt(idx)).join(' ') + ']'
      return '<omitted text>'
    if (Array.isArray(value)) return value.map((v) => (typeof v === 'string' ? '<omitted text>' : v))
  }
  return value
}

export function normalize(o: unknown): unknown {
  return JSON.parse(JSON.stringify(o, dots(normalizeOCRefs, floatRounder, killImageRefs, normalizeText)))
}
