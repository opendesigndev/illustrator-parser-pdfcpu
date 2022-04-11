import { GraphicsState, GraphicsStateProps } from '../entities'
import { ClippingPathOperators, CtorTypes, PathConstructionOperators, PathPaintingOperators } from '../interfaces'

type NONZERO_WINDING_NUMBER = 'nonzero-winding-number'
type EVEN_ODD = 'even-odd'
type FillRule = NONZERO_WINDING_NUMBER | EVEN_ODD

export type Path = {
  Type: 'Path'
  GraphicsState: GraphicsStateProps
  Subpaths: unknown[]
  FillRule: FillRule
  Fill: boolean
  Stroke: boolean
}

export const Path = (GraphicsState: GraphicsState): Path => ({
  Type: 'Path',
  Subpaths: [],
  FillRule: 'nonzero-winding-number',
  Fill: false,
  Stroke: false,
  GraphicsState: GraphicsState.toJS() as GraphicsStateProps,
})

export type PathResult = {
  path?: Path
  clippingPath?: Path
}

const PathBuilderOperators = {
  ...PathConstructionOperators,
  ...PathPaintingOperators,
  ...ClippingPathOperators,
}
export type PathBuilderOperator = CtorTypes<typeof PathBuilderOperators>
