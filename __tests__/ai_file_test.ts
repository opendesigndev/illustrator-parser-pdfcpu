import { ArtBoardRefs, ArtBoard } from '../src/index'
import simpleFile from './fixtures/one.json'
import { readFile } from 'fs/promises'
import { normalize } from '../src/compare'

import { test, expect } from 'vitest'

const testCtx = (): Context => ({
  aiFile: simpleFile,
  streamDict: async (num: number) => readFile(`${__dirname}/fixtures/one.json_${num}`),
  xobjectMutex: new Map(),
  fontCache: new Map(),
  privateData: (async function* () {})(),
  parsedPrivateData: Promise.resolve({
    LayerNames: [],
  }),
  strictPopplerCompat: true,
})

test('ArtBoardRefs: extracts refs of artboards', () => {
  expect(ArtBoardRefs(testCtx()).length).toBe(2)
})

test('ArtBoard: extracts MediaBox of artboard', async () => {
  const ctx = testCtx()
  const ref = ArtBoardRefs(ctx)[1]
  const artboard = await ArtBoard(ctx, ref)
  expect(artboard.MediaBox).toStrictEqual([0.0, 0.0, 177.0, 175.0])
})

test('ArtBoard: extracts Name of artboard', async () => {
  const ctx = testCtx()
  const ref = ArtBoardRefs(ctx)[1]
  const artboard = await ArtBoard(ctx, ref)
  expect(artboard.Name).toStrictEqual('Artboard 2')
})

test('ArtBoard: extracts OCProperties of artboard', async () => {
  const ctx = testCtx()
  const ref = ArtBoardRefs(ctx)[1]
  const artboard = await ArtBoard(ctx, ref)
  expect(artboard.OCProperties!['D']['ON']).toEqual(
    expect.arrayContaining([
      {
        ObjID: 22,
      },
      {
        ObjID: 23,
      },
    ])
  )
  expect(artboard.OCProperties!['D']['OFF']).toEqual([])
})

test('ArtBoard: extracts Resources of artboard', async () => {
  const ctx = testCtx()
  const ref = ArtBoardRefs(ctx)[1]
  const artboard = await ArtBoard(ctx, ref)
  expect(artboard.Resources).toStrictEqual({
    Properties: {
      MC0: {
        Intent: ['View', 'Design'],
        Name: 'two',
        Type: 'OCG',
        Usage: {
          CreatorInfo: {
            Creator: 'Adobe Illustrator 24.1',
            Subtype: 'Artwork',
          },
          ObjID: 31,
        },
        ObjID: 22,
      },
      MC1: {
        Intent: ['View', 'Design'],
        Name: 'Layer 1',
        Type: 'OCG',
        Usage: {
          CreatorInfo: {
            Creator: 'Adobe Illustrator 24.1',
            Subtype: 'Artwork',
          },
          ObjID: 33,
        },
        ObjID: 23,
      },
    },
  })
})

test('ArtBoard: extracts Contents of artboard', async () => {
  const ctx = testCtx()
  const ref = ArtBoardRefs(ctx)[0]
  const artboard = await ArtBoard(ctx, ref)
  expect(artboard.Contents).toStrictEqual({
    Filter: 'FlateDecode',
    Length: 204,
    Kind: 8,
    Data: [
      {
        Type: 'MarkedContext',
        Tag: 'OC',
        Properties: 'MC0',
        Kids: [],
      },
      {
        Type: 'MarkedContext',
        Tag: 'OC',
        Properties: 'MC1',
        Kids: [
          {
            Type: 'Path',
            GraphicsState: {
              CTM: [1, 0, 0, 1, 454, 370.5],
              ClippingPath: [
                {
                  Type: 'Path',
                  GraphicsState: {
                    CTM: null,
                    ColorSpaceStroking: 'DeviceGray',
                    ColorSpaceNonStroking: 'DeviceGray',
                    ColorStroking: [0, 0, 0],
                    ColorNonStroking: [0, 0, 0],
                    TextCharSpace: 0.0,
                    TextWordSpace: 0.0,
                    TextScale: 100.0,
                    TextLeading: 0.0,
                    TextFont: null,
                    TextFontSize: 0.0,
                    TextRender: 0.0,
                    TextRise: 0.0,
                    LineWidth: 1.0,
                    LineCap: 0,
                    LineJoin: 0,
                    MiterLimit: 10.0,
                    DashPattern: [[], 0],
                    RenderingIntent: 'RelativeColorimetric',
                    Flatness: 0.0,
                    StrokeAdjustment: false,
                    BlendMode: 'Normal',
                    SoftMask: null,
                    AlphaConstant: 1.0,
                    AlphaSource: false,
                    SpecifiedParameters: null,
                  },
                  Subpaths: [
                    {
                      Type: 'Rect',
                      Coords: [0, 768, 1366, -768],
                    },
                  ],
                  FillRule: 'nonzero-winding-number',
                  Fill: false,
                  Stroke: false,
                },
              ],
              ColorSpaceStroking: 'DeviceGray',
              ColorSpaceNonStroking: 'DeviceRGB',
              ColorStroking: [0, 0, 0],
              ColorNonStroking: [0.0, 0.0, 0.0],
              TextCharSpace: 0.0,
              TextWordSpace: 0.0,
              TextScale: 100.0,
              TextLeading: 0.0,
              TextFont: null,
              TextFontSize: 0.0,
              TextRender: 0.0,
              TextRise: 0.0,
              LineWidth: 1.0,
              LineCap: 0,
              LineJoin: 0,
              MiterLimit: 10.0,
              DashPattern: [[], 0],
              RenderingIntent: 'RelativeColorimetric',
              Flatness: 0.0,
              StrokeAdjustment: false,
              BlendMode: 'Normal',
              SoftMask: null,
              AlphaConstant: 1.0,
              AlphaSource: false,
              SpecifiedParameters: 'GS0',
            },
            Subpaths: [
              {
                Type: 'Path',
                Points: [
                  {
                    Type: 'Move',
                    Coords: [0, 0],
                  },
                  {
                    Type: 'Curve',
                    Coords: [0, -115.151, -58.203, -208.5, -130, -208.5],
                  },
                  {
                    Type: 'Curve',
                    Coords: [-201.797, -208.5, -260, -115.151, -260, 0],
                  },
                  {
                    Type: 'Curve',
                    Coords: [-260, 115.151, -201.797, 208.5, -130, 208.5],
                  },
                  {
                    Type: 'Curve',
                    Coords: [-58.203, 208.5, 0, 115.151, 0, 0],
                  },
                ],
                Closed: true,
              },
            ],
            FillRule: 'nonzero-winding-number',
            Fill: true,
            Stroke: false,
          },
          {
            Type: 'Path',
            GraphicsState: {
              CTM: [1, 0, 0, 1, 1186, 370.5],
              ClippingPath: [
                {
                  Type: 'Path',
                  GraphicsState: {
                    CTM: null,
                    ColorSpaceStroking: 'DeviceGray',
                    ColorSpaceNonStroking: 'DeviceGray',
                    ColorStroking: [0, 0, 0],
                    ColorNonStroking: [0, 0, 0],
                    TextCharSpace: 0.0,
                    TextWordSpace: 0.0,
                    TextScale: 100.0,
                    TextLeading: 0.0,
                    TextFont: null,
                    TextFontSize: 0.0,
                    TextRender: 0.0,
                    TextRise: 0.0,
                    LineWidth: 1.0,
                    LineCap: 0,
                    LineJoin: 0,
                    MiterLimit: 10.0,
                    DashPattern: [[], 0],
                    RenderingIntent: 'RelativeColorimetric',
                    Flatness: 0.0,
                    StrokeAdjustment: false,
                    BlendMode: 'Normal',
                    SoftMask: null,
                    AlphaConstant: 1.0,
                    AlphaSource: false,
                    SpecifiedParameters: null,
                  },
                  Subpaths: [
                    {
                      Type: 'Rect',
                      Coords: [0, 768, 1366, -768],
                    },
                  ],
                  FillRule: 'nonzero-winding-number',
                  Fill: false,
                  Stroke: false,
                },
              ],
              ColorSpaceStroking: 'DeviceGray',
              ColorSpaceNonStroking: 'DeviceRGB',
              ColorStroking: [0, 0, 0],
              ColorNonStroking: [0.0, 0.0, 0.0],
              TextCharSpace: 0.0,
              TextWordSpace: 0.0,
              TextScale: 100.0,
              TextLeading: 0.0,
              TextFont: null,
              TextFontSize: 0.0,
              TextRender: 0.0,
              TextRise: 0.0,
              LineWidth: 1.0,
              LineCap: 0,
              LineJoin: 0,
              MiterLimit: 10.0,
              DashPattern: [[], 0],
              RenderingIntent: 'RelativeColorimetric',
              Flatness: 0.0,
              StrokeAdjustment: false,
              BlendMode: 'Normal',
              SoftMask: null,
              AlphaConstant: 1.0,
              AlphaSource: false,
              SpecifiedParameters: 'GS0',
            },
            Subpaths: [
              {
                Type: 'Path',
                Points: [
                  {
                    Type: 'Move',
                    Coords: [0, 0],
                  },
                  {
                    Type: 'Curve',
                    Coords: [0, -115.151, -53.278, -208.5, -119, -208.5],
                  },
                  {
                    Type: 'Curve',
                    Coords: [-184.722, -208.5, -238, -115.151, -238, 0],
                  },
                  {
                    Type: 'Curve',
                    Coords: [-238, 115.151, -184.722, 208.5, -119, 208.5],
                  },
                  {
                    Type: 'Curve',
                    Coords: [-53.278, 208.5, 0, 115.151, 0, 0],
                  },
                ],
                Closed: true,
              },
            ],
            FillRule: 'nonzero-winding-number',
            Fill: true,
            Stroke: false,
          },
        ],
      },
    ],
  })
})

import VectorApple from './fixtures/VectorApple.json'
import VectorAppleExpected from './fixtures/VectorApple_expected.json'
import { Context } from '../src/interfaces'
test('ArtBoard: works for fixture files', async () => {
  const ctx: Context = {
    ...testCtx(),
    aiFile: VectorApple,
    streamDict: async (num: number) => readFile(`${__dirname}/fixtures/VectorApple.json_${num}`),
    externalResourceURLs: {
      Fonts: {},
      Bitmaps: {
        '36': '<placeholder>',
        '245': '<placeholder>',
        '346': '<placeholder>',
        '82': '<placeholder>',
        '453': '<placeholder>',
        '489': '<placeholder>',
      },
    },
  }
  const ref = ArtBoardRefs(ctx)[0]

  const artboard = await ArtBoard(ctx, ref)
  expect(normalize(artboard.Contents)).toStrictEqual(normalize(VectorAppleExpected.Contents))
  expect(normalize(artboard.Resources)).toStrictEqual(normalize(VectorAppleExpected.Resources))
  expect(artboard.OCProperties).toStrictEqual(VectorAppleExpected.OCProperties)
})
