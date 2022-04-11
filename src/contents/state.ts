import { Decoder } from './decoder'
import { GraphicsState, GraphicsStateProps, MarkedContext } from './entities'
import { TextBuilder } from './text-builder'
import { RecordOf, Record, List, updateIn } from 'immutable'
import { Resources } from './interfaces'

type StateProps = {
  readonly decoder: Decoder
  readonly resources: Resources
  readonly strictPopplerCompat: boolean

  context: List<MarkedContext>
  graphics: List<GraphicsState>
  textBuilder?: TextBuilder
}

export type State = RecordOf<StateProps>

export const New = ({
  decoder,
  resources,
  strictPopplerCompat = false,
}: Omit<StateProps, 'context' | 'graphics' | 'textBuilder'>) =>
  Record({
    context: List.of(MarkedContext()),
    graphics: List.of(GraphicsState()),
    textBuilder: undefined,

    strictPopplerCompat,
    decoder,
    resources,
  })()

export function pushKid(state: State, kid: unknown): State {
  return updateIn(state, ['context', 0, 'Kids'], (k) => (k as List<unknown>).push(kid))
}

export function currentGraphics(state: State): GraphicsState {
  const top = state.graphics.first()
  if (!top) {
    throw new Error('Empty graphics stack')
  }
  return top
}

export const withTextBuilder = (state: State, cb: (tb: TextBuilder) => void) => {
  if (!state.textBuilder) {
    throw new Error('Empty text builder')
  }
  cb(state.textBuilder)
  return state
}

export function finishTextGroup(state: State): State {
  if (state.textBuilder && state.textBuilder.text) {
    const text = state.textBuilder.text
    state.textBuilder.text = undefined
    return pushKid(state, text)
  }
  return state
}

export const withCurrentGraphics = (state: State, cb: (tb: GraphicsState) => GraphicsState) => {
  if (state.graphics.size === 0) {
    throw new Error('Empty graphics stack')
  }
  return updateIn(state, ['graphics', 0], (c) => cb(c as GraphicsState))
}

export const currentGraphicsSet = <P extends keyof GraphicsStateProps, V extends GraphicsStateProps[P]>(
  state: State,
  prop: P,
  value: V
) => {
  if (state.graphics.size === 0) {
    throw new Error('Empty graphics stack')
  }
  return updateIn(state, ['graphics', 0], (c) => {
    const currentGraphics = c as GraphicsState
    return currentGraphics.set(prop, value)
  })
}
