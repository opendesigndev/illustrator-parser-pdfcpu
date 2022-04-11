import { mat2d } from 'gl-matrix'
import { GraphicsState, GraphicsStateProps } from './entities'

export type TextGroup = {
  Type: 'TextGroup'
  Texts: Text[]
}

export const TextGroup = (Texts: Text[]): TextGroup => ({
  Type: 'TextGroup',
  Texts,
})

type Text = {
  GraphicsState: GraphicsStateProps
  TextMatrix: number[]
  TextLineMatrix: number[]
  Text: unknown
}

function toValues(mat: mat2d): number[] {
  return [mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]]
}

export class TextBuilder {
  textMatrix: mat2d
  text?: TextGroup

  constructor() {
    this.textMatrix = mat2d.create()
    mat2d.identity(this.textMatrix)
  }

  showText(graphicsState: GraphicsState, Text: unknown) {
    const text = {
      GraphicsState: graphicsState.toJS(),
      TextMatrix: toValues(this.textMatrix),
      TextLineMatrix: toValues(this.textMatrix), // TODO: do we need separate a line matrix?
      Text,
    } as Text
    if (this.text) {
      this.text.Texts.push(text)
    } else {
      this.text = TextGroup([text])
    }
  }
}
