import { parse } from '../src/contents'
import { readFile } from 'fs/promises'
import { FontRef } from '../src/contents/decoder'
import { Font } from '../src/contents/text-encoding'
import { normalize } from '../src/compare'

import { test, expect } from 'vitest'

const Resources = {
  ColorSpace: {
    CS0: 'DeviceRGB',
  },
  ExtGState: {},
  Font: {},
}

// NOTE: this causes non-ASCII text in fixtures to render broken. Beware.
const testFontReader = {
  get: async (_id: FontRef): Promise<Font> => {
    return {
      Encoding: 'Identity-H',
    }
  },
}

test('parse: handles simple marked context', async () => {
  const data = await readFile(`${__dirname}/fixtures/one.json_29`)
  expect(await parse(data, Resources, testFontReader, true)).toEqual([
    {
      Kids: [],
      Properties: 'MC0',
      Tag: 'OC',
      Type: 'MarkedContext',
    },
    {
      Kids: [],
      Properties: 'MC1',
      Tag: 'OC',
      Type: 'MarkedContext',
    },
  ])
})

test('parse: handles marked context w/ paths', async () => {
  const data = await readFile(`${__dirname}/fixtures/one.json_26`)
  expect(await parse(data, Resources, testFontReader, true)).toEqual([
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
  ])
})
