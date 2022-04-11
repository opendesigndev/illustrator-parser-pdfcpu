import { ArtBoard, ArtBoardRefs, PrivateData } from '../src/index'
import { WasmContext, WASMContext } from '../src/wasm-context'

import { readFile } from 'fs/promises'
import { test, expect } from 'vitest'

const testCtx = async (): Promise<WasmContext> => WASMContext(await readFile(`${__dirname}/fixtures/one.ai`))

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
