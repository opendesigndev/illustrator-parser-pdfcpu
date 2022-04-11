// Helpers to transform output into compatible with old version

import { Resources } from './contents/interfaces'
import { mapObject, traverse, OCProperties as RawOCProperties, PDFRef } from './pdf-types'

export async function killSMaskNone(src: Resources): Promise<Resources> {
  const trampoline = async (obj: Record<string, unknown>) => {
    if (obj['SMask'] === 'None') {
      obj['SMask'] = null
      return obj
    }
    return mapObject(obj, trampoline)
  }
  return traverse(src, trampoline) as Promise<Resources>
}

export async function parseSeparation(src: Resources): Promise<Resources> {
  const trampoline = async (obj: Record<string, unknown>) => {
    Object.keys(obj).forEach((key) => {
      const arr = obj[key]
      if (Array.isArray(arr) && arr[0] === 'Separation' && typeof arr[1] === 'string') {
        arr[1] = arr[1].replaceAll('#20', ' ')
        return obj
      }
    })
    return mapObject(obj, trampoline)
  }
  return traverse(src, trampoline) as Promise<Resources>
}

interface OCRef {
  ObjID: number
}

export type OCProperties = {
  D: { OFF: OCRef[]; ON: OCRef[] }
}

function compareOCRefs(a: OCRef, b: OCRef): number {
  return b.ObjID - a.ObjID
}

function toOCRef(ref: PDFRef): OCRef {
  return { ObjID: ref.ObjectNumber }
}

export async function mapOCProperties(src?: RawOCProperties): Promise<OCProperties> {
  if (!src) {
    return {
      D: {
        OFF: [],
        ON: [],
      },
    }
  }
  const val = {
    D: {
      OFF: (src['D']['OFF'] ?? []).map((ref) => toOCRef(ref)),
      ON: (src['D']['ON'] ?? []).map((ref) => toOCRef(ref)),
    },
  }
  val['D']['OFF'].sort(compareOCRefs)
  val['D']['ON'].sort(compareOCRefs)
  return val
}
