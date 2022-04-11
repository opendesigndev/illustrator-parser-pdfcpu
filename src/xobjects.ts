import { mark, stop } from 'marky'
import { parse } from './contents'
import { Resources } from './contents/interfaces'
import { FontReader } from './fonts'
import { AIFile, ContentsDict, Context } from './interfaces'
import {
  isPDFRef,
  mapObject,
  PDFObjectWithoutRefs,
  PDFObjectWithRefs,
  PDFRef,
  PDFValue,
  StreamDict,
  traverse,
  XObject,
} from './pdf-types'
import { Cache } from './utils/memoize'
import { hasOwnProperty, isNonNullObject } from './utils/types'

export function deref(aiFile: AIFile, ref: PDFRef): XObject {
  return aiFile.XRefTable.Table[ref.ObjectNumber]
}

async function parseXObjectStreamDict(ctx: Context, id: number, resources: Resources): Promise<unknown[]> {
  const cache = new Cache<number, Promise<unknown[]>>(ctx.xobjectMutex)
  return cache.upsert(id, async () => {
    const streamData = await ctx.streamDict(id)
    return parse(streamData, resources, new FontReader(ctx.streamDict, ctx.fontCache), Boolean(ctx.strictPopplerCompat))
  })
}

export async function parseContentStream(ctx: Context, obj: PDFRef, resources: Resources): Promise<ContentsDict> {
  const id = obj.ObjectNumber
  const timeLabel = `parseContentStream(${id})`
  mark(timeLabel)
  const contentsDict = deref(ctx.aiFile, obj) as StreamDict
  const Data = await parseXObjectStreamDict(ctx, obj.ObjectNumber, resources)
  stop(timeLabel)
  return ctx.strictPopplerCompat
    ? { Data, Kind: 8, Filter: contentsDict.Object.Dict.Filter, Length: contentsDict.Object.Dict.Length }
    : { Data }
}

function bitmap(ctx: Context, objID: number): unknown {
  const Image = ctx.externalResourceURLs?.Bitmaps[objID.toString()] ?? objID.toString()
  return { Image }
}

function font(ctx: Context, objID: number): unknown {
  const Font = ctx.externalResourceURLs?.Fonts[objID.toString()] ?? objID.toString()
  return { Font }
}

export async function parseXObjects(ctx: Context, Resources: Resources): Promise<Resources> {
  const trampoline = async (obj: Record<string, unknown>) => {
    if (!hasOwnProperty(obj, 'ObjID') || typeof obj.ObjID !== 'number') return mapObject(obj, trampoline)
    if (hasOwnProperty(obj, 'Resources') && obj.Resources) {
      const resources = (await traverse(obj.Resources, trampoline)) as Resources // forms & patterns have their own resources
      const data = await parseXObjectStreamDict(ctx, obj.ObjID, resources)
      return {
        ...obj,
        Data: await traverse(data, trampoline),
        Resources: resources,
      }
    }
    const subtype = hasOwnProperty(obj, 'Subtype') && obj.Subtype
    if (subtype === 'Image') return { ...obj, Data: bitmap(ctx, obj.ObjID) }
    if (subtype === 'TrueType') return { ...obj, Data: font(ctx, obj.ObjID) }

    return mapObject(obj, trampoline)
  }
  return traverse(Resources, trampoline) as Promise<Resources>
}

export async function derefDeep(ctx: Context, src: PDFObjectWithRefs): Promise<Resources> {
  if (src === null) {
    throw new Error('derefDeep got null')
  }
  const trampoline = async (obj: Record<string, unknown>): Promise<PDFObjectWithoutRefs> => {
    if (!isPDFRef(obj)) return mapObject(obj, trampoline) as Promise<PDFObjectWithoutRefs>

    const val = deref(ctx.aiFile, obj)['Object']
    if (Array.isArray(val)) return Promise.all(val.map((v) => traverse(v, trampoline))) as Promise<PDFObjectWithoutRefs>

    const ObjID = obj.ObjectNumber
    if (isNonNullObject(val)) {
      if (ctx.strictPopplerCompat && hasOwnProperty(val, 'Dict')) {
        const Kind = hasOwnProperty(val, 'FilterPipeline') && val.FilterPipeline !== null ? 8 : 0
        const newVal = Object.assign({ Kind, ObjID }, val['Dict'])
        return traverse(newVal, trampoline) as Promise<PDFValue>
      }
      const newVal = Object.assign({ ObjID }, val)
      return traverse(newVal, trampoline) as Promise<PDFValue>
    }
    return val as PDFValue
  }
  return traverse(src, trampoline) as Promise<Resources>
}
