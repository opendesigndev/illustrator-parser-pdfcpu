import { ArtBoard, ArtBoardRefs, PrivateData } from '../src/index'
import { FSContext, FsContext } from '../src/fs-context'

import { test, expect } from 'vitest'

const testCtx = async (fixture = 'one.ai'): Promise<FsContext> =>
  FSContext({ file: `${__dirname}/fixtures/${fixture}` })

test('ArtBoardRefs: extracts refs of artboards', async () => {
  expect(ArtBoardRefs(await testCtx()).length).toBe(2)
})

test('PrivateData: extracts private Illustrator data', async () => {
  expect(await PrivateData(await testCtx())).toStrictEqual({
    LayerNames: ['two', 'pes'],
    TextLayers: [],
  })
})

test('ArtBoard: extracts MediaBox of artboard', async () => {
  const ctx = await testCtx()
  const ref = ArtBoardRefs(ctx)[1]
  const artboard = await ArtBoard(ctx, ref)
  expect(artboard.MediaBox).toStrictEqual([0.0, 0.0, 177.0, 175.0])
})

test('ArtBoard: contains path to image on disk', async () => {
  const ctx = await testCtx('VectorApple.ai')
  const ref = ArtBoardRefs(ctx)[0]
  const {
    Resources: {
      XObject: {
        Im0: {
          Data: { Image },
        },
      },
    },
  } = (await ArtBoard(ctx, ref)) as any
  expect(Image).toBe('bitmaps/36.png')
})
