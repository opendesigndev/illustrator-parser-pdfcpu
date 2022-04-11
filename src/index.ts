import { isXPage, isXPages, PDFRef } from './pdf-types'
import { parsePrivateData } from './private-data'
import { deref, derefDeep, parseContentStream, parseXObjects } from './xobjects'

import { mark, stop } from 'marky'
import { ContentsDict, Context } from './interfaces'
import { killSMaskNone, mapOCProperties, OCProperties, parseSeparation } from './tweaks'
import { Resources } from './contents/interfaces'

// https://basarat.gitbook.io/typescript/main-1/nominaltyping
export type ArtBoardRef = { idx: number; ref: PDFRef } & { readonly '': unique symbol }

// Objects of Type === Pages contain Kids.
// Artboards are leafs on that tree
export function ArtBoardRefs(ctx: Context): ArtBoardRef[] {
  mark('ArtBoardRefs')
  const queue = [ctx.aiFile.XRefTable.RootDict['Pages'] as PDFRef] // not-quite-optimal, should either use stack or dedicated structure
  const leafs = []
  let ref
  while ((ref = queue.shift()) !== undefined) {
    const node = deref(ctx.aiFile, ref).Object
    if (isXPages(node)) {
      for (const kid of node['Kids'] as PDFRef[]) {
        queue.push(kid)
      }
    } else {
      leafs.push(ref)
    }
  }
  const refs = leafs.map((ref: PDFRef, idx: number) => ({ idx, ref } as ArtBoardRef))
  stop('ArtBoardRefs')
  return refs
}

export function PrivateData(ctx: Context): ReturnType<typeof parsePrivateData> {
  if (!ctx.parsedPrivateData) {
    ctx.parsedPrivateData = parsePrivateData(() => ctx.privateData())
  }
  return ctx.parsedPrivateData
}

interface ArtBoard {
  Contents: ContentsDict
  MediaBox: number[]
  Resources: Resources
  OCProperties?: OCProperties
  Name: string
}

export async function ArtBoard(ctx: Context, ref: ArtBoardRef): Promise<ArtBoard> {
  const privateData = await PrivateData(ctx)
  const Name = privateData.LayerNames[ref.idx] || `Artboard ${ref.idx + 1}`
  mark(Name)
  const page = deref(ctx.aiFile, ref.ref).Object
  if (!isXPage(page)) {
    throw new Error(`page ${ref} is not a page in XRefTable`)
  }
  let resources = await derefDeep(ctx, page.Resources)
  const OCProperties = await mapOCProperties(ctx.aiFile.XRefTable.RootDict.OCProperties)
  if (ctx.strictPopplerCompat) {
    resources = await parseSeparation(await killSMaskNone(resources))
  }
  const parsed = {
    Contents: await parseContentStream(ctx, page.Contents, resources),
    MediaBox: page.MediaBox,
    Resources: await parseXObjects(ctx, resources),
    OCProperties,
    Name,
  }
  stop(Name)
  return parsed
}
