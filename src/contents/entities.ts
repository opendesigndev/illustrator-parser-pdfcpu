import { List, Record as R, RecordOf } from 'immutable'
import { ColorSpace } from './colors'

export type GraphicsStateProps = {
  CTM?: number[] | null
  ClippingPath?: unknown[] | null
  ColorSpaceStroking: string | ColorSpace
  ColorSpaceNonStroking: string | ColorSpace
  ColorStroking: (number | string)[]
  ColorNonStroking: (number | string)[]
  TextCharSpace: number
  TextWordSpace: number
  TextScale: number
  TextLeading: number
  TextFont?: string | null
  TextFontSize: number
  TextRender: number
  TextRise: number
  LineWidth: number
  LineCap: number
  LineJoin: number
  MiterLimit: number
  DashPattern: unknown[]
  RenderingIntent: string
  Flatness: number
  StrokeAdjustment: boolean
  BlendMode: string
  SoftMask?: null
  AlphaConstant: number
  AlphaSource: boolean
  SpecifiedParameters?: unknown
}

export type GraphicsState = RecordOf<GraphicsStateProps>

export const GraphicsState = R({
  CTM: null,
  ClippingPath: null,
  ColorSpaceStroking: 'DeviceGray',
  ColorSpaceNonStroking: 'DeviceGray',
  ColorStroking: [0, 0, 0],
  ColorNonStroking: [0, 0, 0],
  TextCharSpace: 0,
  TextWordSpace: 0,
  TextScale: 100,
  TextLeading: 0,
  TextFont: null,
  TextFontSize: 0,
  TextRender: 0,
  TextRise: 0,
  LineWidth: 1,
  LineCap: 0,
  LineJoin: 0,
  MiterLimit: 10,
  DashPattern: [[], 0],
  RenderingIntent: 'RelativeColorimetric',
  Flatness: 0,
  StrokeAdjustment: false,
  BlendMode: 'Normal',
  SoftMask: null,
  AlphaConstant: 1,
  AlphaSource: false,
  SpecifiedParameters: null,
})

export type MarkedContext = RecordOf<{
  Kids: List<unknown>
  Type: 'MarkedContext'
  Tag?: string
  Properties?: string
}>

export const MarkedContext = R({
  Type: 'MarkedContext',
  Kids: List(),

  Tag: undefined as string | undefined,
  Properties: undefined as string | undefined,
} as const)

export type XObject = {
  Type: 'XObject'
  Name: string
  GraphicsState: GraphicsStateProps
}

export const XObject = (Name: string, GraphicsState: GraphicsState): XObject => ({
  Type: 'XObject',
  Name,
  GraphicsState: GraphicsState.toJS() as GraphicsStateProps,
})

export type Shading = {
  Type: 'Shading'
  Name: string
  GraphicsState: GraphicsStateProps
}

export const Shading = (Name: string, GraphicsState: GraphicsState): Shading => ({
  Type: 'Shading',
  Name,
  GraphicsState: GraphicsState.toJS() as GraphicsStateProps,
})
