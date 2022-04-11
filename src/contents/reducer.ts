import { unshift, all } from '../utils/stream'
import { mat2d, vec2 } from 'gl-matrix'
import { ColorSpace, defaultColor, mapAlternate, mapAlternateShape } from './colors'
import { decodeDashPattern, decodeName, decodeNames, decodeNumber, decodeNumbers, decode, DecodeType } from './decoder'
import { MarkedContext, Shading, XObject } from './entities'
import { PathBuilder } from './path-builder'
import {
  currentGraphics,
  currentGraphicsSet,
  finishTextGroup,
  pushKid,
  State,
  withCurrentGraphics,
  withTextBuilder,
} from './state'
import { TextBuilder } from './text-builder'

import { Operands } from '../syntax/interfaces'
import {
  CompatibilityOperator,
  CompatibilityOperators,
  ContentStreamOperator,
  GraphicStateOperator,
  GraphicStateOperators,
  MarkedContentOperator,
  MarkedContentOperators,
  ShadingOperator,
  ShadingOperators,
  TextObjectOperator,
  TextObjectOperators,
  TextPositioningOperator,
  TextPositioningOperators,
  TextShowingOperators,
  TextShowingOperator,
  TextStateOperator,
  TextStateOperators,
  XObjectOperator,
  XObjectOperators,
  ColourOperator,
  ColourOperators,
  PathConstructionOperators,
  ContentStreamOperators,
} from './interfaces'
import { assertNever } from '../utils/types'
import { PathBuilderOperator } from './path-builder/interfaces'

export class Reducer {
  constructor(private ops: Generator<ContentStreamOperator>) {}

  private applyPathObjectOps(state: State, ops: Generator<ContentStreamOperator>): State {
    // Path object only allows path construction operators - so we can safely handle it in a separate loop
    const result = new PathBuilder(
      currentGraphics(state),
      state.strictPopplerCompat,
      ops as Generator<PathBuilderOperator>
    ).run()
    if (result.path) {
      state = pushKid(state, result.path)
    }
    if (result.clippingPath) {
      state = withCurrentGraphics(state, (g) =>
        g.update('ClippingPath', (path) => [...(path ?? []), result.clippingPath])
      )
    }
    return state
  }

  private pushMarkedContext(state: State, args: Operands): State {
    const names = Array.from(decodeNames(args))
    return state.update('context', (c) =>
      c.unshift(MarkedContext({ Tag: names[0], Properties: names[1] /* might be null */ }))
    )
  }

  private popMarkedContext(state: State): State {
    const top = state.context.first()
    if (!top) {
      throw new Error('Marked Context pop without respective push')
    }
    return pushKid(
      state.update('context', (c) => c.shift()),
      top.toJS()
    )
  }

  private moveStartWithLeadingOffset(state: State, args: Operands): Promise<State> {
    const [, y] = Array.from(decodeNumbers(args))
    state = withCurrentGraphics(state, (g) => g.set('TextLeading', -y))
    return this.apply(state, ContentStreamOperators.Td({ args }))
  }

  private async showText(state: State, args: Operands): Promise<State> {
    const graphicsState = currentGraphics(state)
    const fontRef = graphicsState.TextFont
    if (!fontRef) {
      throw new Error('TextFont is undefined during Tj')
    }
    const font = state.resources.Font[fontRef]

    const [Text] = await all(state.decoder.decodeText(font, args))

    return withTextBuilder(state, (textBuilder) => {
      pushKid(state, textBuilder.showText(graphicsState, Text))
    })
  }

  private async nextLineAndShowTextAndSpacing(state: State, args: Operands): Promise<State> {
    const [w, c, str] = args
    state = await this.apply(state, ContentStreamOperators.Tw({ args: [w] }))
    state = await this.apply(state, ContentStreamOperators.Tc({ args: [c] }))
    state = await this.apply(state, ContentStreamOperators["'"]({ args: [str] }))
    return state
  }

  private async showTextIndividualPositioning(state: State, args: Operands): Promise<State> {
    const graphicsState = currentGraphics(state)
    const fontRef = graphicsState.TextFont
    if (!fontRef) {
      throw new Error('TextFont is undefined during TJ')
    }
    const vals = await all(state.decoder.decodeIndividualGlyphPositioning(state.resources.Font[fontRef], args))
    return withTextBuilder(state, (textBuilder) => {
      pushKid(state, textBuilder.showText(graphicsState, vals))
    })
  }

  private decodeColorSpace(state: State, args: Operands): ColorSpace {
    const name = decodeName(args)
    let colorSpace = state.resources.ColorSpace[name] ?? name
    if (Array.isArray(colorSpace) && colorSpace.length === 1) {
      colorSpace = colorSpace[0]
    }
    return state.strictPopplerCompat ? mapAlternate(colorSpace) : colorSpace
  }

  private async applyCompatibilityOperators(state: State, op: CompatibilityOperator): Promise<State> {
    switch (op.name) {
      case 'BX':
      case 'EX':
        return state
      default:
        assertNever(op)
    }
  }

  private async applyMarkedContentOperators(state: State, op: MarkedContentOperator): Promise<State> {
    switch (op.name) {
      case 'BDC':
      case 'BMC':
        return this.pushMarkedContext(state, op.args)
      case 'EMC':
        return this.popMarkedContext(state)
      default:
        console.warn(`Unhandled operator ${op.name}`)
        return state
    }
  }

  private decodeSpecifiedParameters(state: State, args: Operands) {
    const name = decodeName(args)
    return state.strictPopplerCompat ? name : state.resources.ExtGState[name] ?? name
  }

  private async applyGraphicStateOperators(state: State, op: GraphicStateOperator): Promise<State> {
    switch (op.name) {
      case 'q':
        return state.update('graphics', (g) => g.unshift(currentGraphics(state)))
      case 'Q':
        return state.update('graphics', (g) => g.shift())
      case 'cm':
        return currentGraphicsSet(state, 'CTM', Array.from(decodeNumbers(op.args)))
      case 'w':
        return currentGraphicsSet(state, 'LineWidth', decodeNumber(op.args))
      case 'J':
        return currentGraphicsSet(state, 'LineCap', decodeNumber(op.args))
      case 'j':
        return currentGraphicsSet(state, 'LineJoin', decodeNumber(op.args))
      case 'M':
        return currentGraphicsSet(state, 'MiterLimit', decodeNumber(op.args))
      case 'd':
        return currentGraphicsSet(state, 'DashPattern', Array.from(decodeDashPattern(op.args)))
      case 'ri':
        return currentGraphicsSet(state, 'RenderingIntent', decodeName(op.args))
      case 'i':
        return currentGraphicsSet(state, 'Flatness', decodeNumber(op.args))
      case 'gs':
        return currentGraphicsSet(state, 'SpecifiedParameters', this.decodeSpecifiedParameters(state, op.args))
      default:
        assertNever(op)
    }
  }

  private async applyXObjectOperators(state: State, op: XObjectOperator): Promise<State> {
    switch (op.name) {
      case 'Do':
        return pushKid(state, XObject(decodeName(op.args), currentGraphics(state)))
      default:
        // NOTE: Since XObjectOperator is not a union, TS doesn't narrow the type to "never" here for some reason.
        assertNever(op as never)
    }
  }

  private async applyShadingOperators(state: State, op: ShadingOperator): Promise<State> {
    switch (op.name) {
      case 'sh':
        return pushKid(state, Shading(decodeName(op.args), currentGraphics(state)))
      default:
        // NOTE: Since ShadingOperator is not a union, TS doesn't narrow the type to "never" here for some reason.
        assertNever(op as never)
    }
  }

  private async applyTextObjectOperators(state: State, op: TextObjectOperator): Promise<State> {
    switch (op.name) {
      case 'BT':
        return state.set('textBuilder', new TextBuilder())
      case 'ET':
        return finishTextGroup(state).remove('textBuilder')
      default:
        assertNever(op)
    }
  }

  private async applyTextPositioningOperators(state: State, op: TextPositioningOperator): Promise<State> {
    switch (op.name) {
      case 'TD':
        return this.moveStartWithLeadingOffset(state, op.args)
      case 'Tm':
        state = withTextBuilder(state, (textBuilder) => {
          const [a, b, c, d, e, f] = Array.from(decodeNumbers(op.args))
          textBuilder.textMatrix = mat2d.fromValues(a, b, c, d, e, f)
        })
        return finishTextGroup(state)
      case 'Td':
        state = withTextBuilder(state, (textBuilder) => {
          const [x, y] = Array.from(decodeNumbers(op.args))
          mat2d.translate(textBuilder.textMatrix, textBuilder.textMatrix, vec2.fromValues(x, y))
        })
        return finishTextGroup(state)
      // NOTE: I'm not sure if these should modify textMatrix. poppler doesn't and yet there are differences in some cases.
      case 'T*':
        return withTextBuilder(state, (textBuilder) =>
          mat2d.translate(
            textBuilder.textMatrix,
            textBuilder.textMatrix,
            vec2.fromValues(0, -currentGraphics(state).TextLeading)
          )
        )
      default:
        assertNever(op)
    }
  }

  private async applyTextShowingOperators(state: State, op: TextShowingOperator): Promise<State> {
    switch (op.name) {
      // 9.4.3 Text-Showing Operators
      case 'Tj':
        return this.showText(state, op.args)
      case "'":
        state = await this.applyTextPositioningOperators(state, TextPositioningOperators['T*']())
        state = await this.applyTextShowingOperators(state, TextShowingOperators.Tj(op))
        return state
      case '"':
        return this.nextLineAndShowTextAndSpacing(state, op.args)
      case 'TJ':
        return this.showTextIndividualPositioning(state, op.args)
      default:
        assertNever(op)
    }
  }

  private async applyTextStateOperators(state: State, op: TextStateOperator): Promise<State> {
    switch (op.name) {
      case 'Tw':
        return currentGraphicsSet(state, 'TextWordSpace', decodeNumber(op.args))
      case 'Tc':
        return currentGraphicsSet(state, 'TextCharSpace', decodeNumber(op.args))
      case 'Tz':
        return currentGraphicsSet(state, 'TextScale', decodeNumber(op.args))
      case 'TL':
        return currentGraphicsSet(state, 'TextLeading', decodeNumber(op.args))
      case 'Tf':
        return withCurrentGraphics(state, (currentGraphics) => {
          const [font, size] = op.args
          return currentGraphics.set('TextFont', decodeName([font])).set('TextFontSize', decodeNumber([size]))
        })
      case 'Tr':
        return currentGraphicsSet(state, 'TextRender', decodeNumber(op.args))
      case 'Ts':
        return currentGraphicsSet(state, 'TextRise', decodeNumber(op.args))
      default:
        assertNever(op)
    }
  }

  // If the current stroking colour space is a Separation, DeviceN, or
  // ICCBased colour space, the operands c1...cn shall be numbers. The
  // number of operands and their interpretation depends on the colour space.
  // If the current stroking colour space is a Pattern colour space, name shall
  // be the name of an entry in the Pattern subdictionary of the current
  // resource dictionary (see 7.8.3, "Resource Dictionaries"). For an
  // uncoloured tiling pattern (PatternType = 1 and PaintType = 2), c1...cn
  // shall be component values specifying a colour in the pattern’s underlying
  // colour space. For other types of patterns, these operands shall not be
  // specified
  private decodeScn(
    state: State,
    args: Operands,
    property: 'ColorStroking' | 'ColorNonStroking',
    colorSpace: 'ColorSpaceStroking' | 'ColorSpaceNonStroking'
  ): State {
    return withCurrentGraphics(state, (currentGraphics) => {
      const expectedOperands = currentGraphics[colorSpace] === 'Pattern' ? DecodeType.Pattern : DecodeType.MultiNumber
      const ops = Array.from(decode(expectedOperands, args))
      const color = state.strictPopplerCompat ? mapAlternateShape(currentGraphics[colorSpace], ops as number[]) : ops
      return currentGraphics.set(property, color)
    })
  }

  private setColors(
    state: State,
    args: Operands,
    property: 'ColorStroking' | 'ColorNonStroking',
    colorSpace: 'ColorSpaceStroking' | 'ColorSpaceNonStroking',
    colorSpaceValue: 'DeviceGray' | 'DeviceRGB' | 'DeviceCMYK'
  ): State {
    return withCurrentGraphics(state, (currentGraphics) =>
      currentGraphics.set(colorSpace, colorSpaceValue).set(property, Array.from(decodeNumbers(args)))
    )
  }

  private decodeCs(
    state: State,
    args: Operands,
    property: 'ColorStroking' | 'ColorNonStroking',
    colorSpace: 'ColorSpaceStroking' | 'ColorSpaceNonStroking'
  ): State {
    return withCurrentGraphics(state, (currentGraphics) => {
      const colorSpaceValue = this.decodeColorSpace(state, args)
      return currentGraphics.set(colorSpace, colorSpaceValue).set(property, defaultColor(colorSpace))
    })
  }

  private decodeSc(state: State, args: Operands, property: 'ColorStroking' | 'ColorNonStroking'): State {
    return withCurrentGraphics(state, (currentGraphics) =>
      currentGraphics.set(property, Array.from(decodeNumbers(args)))
    )
  }

  private async applyColourOperators(state: State, op: ColourOperator): Promise<State> {
    switch (op.name) {
      case 'CS':
        return this.decodeCs(state, op.args, 'ColorStroking', 'ColorSpaceStroking')
      case 'cs':
        return this.decodeCs(state, op.args, 'ColorNonStroking', 'ColorSpaceNonStroking')
      case 'SCN':
        return this.decodeScn(state, op.args, 'ColorStroking', 'ColorSpaceStroking')
      case 'scn':
        return this.decodeScn(state, op.args, 'ColorNonStroking', 'ColorSpaceNonStroking')
      case 'SC':
        return this.decodeSc(state, op.args, 'ColorStroking')
      case 'sc':
        return this.decodeSc(state, op.args, 'ColorNonStroking')
      case 'G':
        return this.setColors(state, op.args, 'ColorStroking', 'ColorSpaceStroking', 'DeviceGray')
      case 'g':
        return this.setColors(state, op.args, 'ColorNonStroking', 'ColorSpaceNonStroking', 'DeviceGray')
      case 'RG':
        return this.setColors(state, op.args, 'ColorStroking', 'ColorSpaceStroking', 'DeviceRGB')
      case 'rg':
        return this.setColors(state, op.args, 'ColorNonStroking', 'ColorSpaceNonStroking', 'DeviceRGB')
      case 'K':
        return this.setColors(state, op.args, 'ColorStroking', 'ColorSpaceStroking', 'DeviceCMYK')
      case 'k':
        return this.setColors(state, op.args, 'ColorNonStroking', 'ColorSpaceNonStroking', 'DeviceCMYK')
      default:
        assertNever(op)
    }
  }

  private async apply(state: State, op: ContentStreamOperator): Promise<State> {
    if (op.name in CompatibilityOperators) return this.applyCompatibilityOperators(state, op as CompatibilityOperator)
    if (op.name in MarkedContentOperators) return this.applyMarkedContentOperators(state, op as MarkedContentOperator)
    if (op.name in GraphicStateOperators) return this.applyGraphicStateOperators(state, op as GraphicStateOperator)
    if (op.name in XObjectOperators) return this.applyXObjectOperators(state, op as XObjectOperator)
    if (op.name in ShadingOperators) return this.applyShadingOperators(state, op as ShadingOperator)
    if (op.name in TextObjectOperators) return this.applyTextObjectOperators(state, op as TextObjectOperator)
    if (op.name in TextPositioningOperators)
      return this.applyTextPositioningOperators(state, op as TextPositioningOperator)
    if (op.name in TextShowingOperators) return this.applyTextShowingOperators(state, op as TextShowingOperator)
    if (op.name in TextStateOperators) return this.applyTextStateOperators(state, op as TextStateOperator)
    if (op.name in ColourOperators) return this.applyColourOperators(state, op as ColourOperator)
    if (op.name in PathConstructionOperators) return this.applyPathObjectOps(state, unshift(op, this.ops))
    throw new Error(`AssertionError: unhandled operator ${op.name}`)
  }

  public async run(state: State): Promise<State> {
    for (const op of this.ops) {
      state = await this.apply(state, op)
    }
    return state
  }
}
