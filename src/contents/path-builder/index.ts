import { decodeNumbers } from '../decoder'
import { GraphicsState } from '../entities'
import {
  ClippingPathOperator,
  ClippingPathOperators,
  PathConstructionOperator,
  PathConstructionOperators,
  PathPaintingOperator,
  PathPaintingOperators,
} from '../interfaces'
import { assertNever } from '../../utils/types'
import { Operands } from '../../syntax/interfaces'
import { Path, PathBuilderOperator, PathResult } from './interfaces'

function isLowerCase(str: string): boolean {
  return str.toLowerCase() === str
}

export class PathBuilder {
  path: Path
  clippingPath?: Path
  currentPath: unknown[] = []
  private _currentPoint?: [number, number]

  constructor(
    graphicsState: GraphicsState,
    private strictPopplerCompat: boolean,
    private ops: Generator<PathBuilderOperator>
  ) {
    this.path = Path(graphicsState)
  }

  public run(): PathResult {
    for (;;) {
      // BEWARE: using for (const [op, args] of ops) doesn't work. See streams_test.ts
      const { value: op } = this.ops.next()
      const returnValue = this.apply(op)
      if (returnValue) {
        return { ...returnValue, clippingPath: this.clippingPath }
      }
    }
  }

  private movingCurrentPoint(args: Operands, f: (ns: number[]) => void) {
    const coords = Array.from(decodeNumbers(args))
    f(coords)
    this.currentPoint = coords.slice(-2) as [number, number]
  }

  private pushOperator(args: Operands, type: string) {
    this.movingCurrentPoint(args, (Coords) => {
      this.currentPath.push({
        Type: type,
        Coords,
      })
    })
  }

  // args:  x1 y1 x2 y2 x3 y3
  // Append a cubic Bézier curve to the current path. The curve
  // shall extend from the current point to the point (x3, y3 ), using
  // (x1 , y1 ) and (x2 , y2 ) as the Bézier control points.
  // The new current point shall be (x3 , y3 )
  private pushCurve(args: Operands) {
    return this.pushOperator(args, 'Curve')
  }

  // args: x2 y2 x3 y3
  // Append a cubic Bézier curve to the current path. The curve
  // shall extend from the current point to the point (x3 , y3 ), using
  // the current point and (x2 , y2 ) as the Bézier control points.
  // The new current point shall be (x3 , y3 )
  private pushCurveFromCurrentPoint(args: Operands) {
    this.movingCurrentPoint(args, (Coords) => {
      this.currentPath.push({
        Type: 'Curve',
        Coords: Array.of(...this.currentPoint, ...Coords),
      })
    })
  }

  // args: x1 y1 x3 y3
  // Append a cubic Bézier curve to the current path. The curve
  // shall extend from the current point to the point (x3 , y3 ), using
  // (x1 , y1 ) and (x3 , y3 ) as the Bézier control points.
  // The new current point shall be (x3 , y3 ).
  private pushCurveByCurrentPoint(args: Operands) {
    this.movingCurrentPoint(args, (Coords) => {
      this.currentPath.push({
        Type: 'Curve',
        Coords: Array.of(...Coords, ...Coords.slice(-2)),
      })
    })
  }

  private applyPathConstructionOperator(op: PathConstructionOperator): void {
    switch (op.name) {
      case 'm':
        this.finishCurrentPath(false)
        return this.pushOperator(op.args, 'Move')
      case 'l':
        return this.pushOperator(op.args, 'Line')
      case 'c':
        return this.pushCurve(op.args)
      case 'v':
        return this.pushCurveFromCurrentPoint(op.args)
      case 'y':
        return this.pushCurveByCurrentPoint(op.args)
      case 'h':
        this.finishCurrentPath(true)
        return
      case 're':
        this.path.Subpaths.push({
          Type: 'Rect',
          Coords: Array.from(decodeNumbers(op.args)),
        })
        return
      default:
        assertNever(op)
    }
  }

  // 8.5.3 Path-Painting Operators
  private applyPathPaintingOperator(op: PathPaintingOperator): { path?: Path } {
    switch (op.name) {
      case 'S':
      case 's':
        this.finishCurrentPath(isLowerCase(op.name))
        return { path: { ...this.path, Stroke: true } }
      case 'F':
      case 'f':
        this.finishCurrentPath(true)
        return { path: { ...this.path, Fill: true } }
      case 'f*':
        this.finishCurrentPath(true)
        return { path: { ...this.path, Fill: true, FillRule: 'even-odd' } }
      case 'B':
      case 'b':
        this.finishCurrentPath(isLowerCase(op.name))
        return { path: { ...this.path, Fill: true, Stroke: true } }
      case 'B*':
      case 'b*':
        this.finishCurrentPath(isLowerCase(op.name))
        return { path: { ...this.path, Fill: true, FillRule: 'even-odd', Stroke: true } }
      case 'n':
        return { path: undefined }
      default:
        assertNever(op)
    }
  }

  private applyClippingPathOperator(op: ClippingPathOperator): void {
    switch (op.name) {
      // 8.5.4 Clipping Path Operators
      case 'W':
        this.finishCurrentPath(true)
        if (this.strictPopplerCompat) {
          delete this.path.GraphicsState.ClippingPath
        }
        this.clippingPath = this.path
        return
      case 'W*':
        this.path.FillRule = 'even-odd'
        this.finishCurrentPath(true)
        if (this.strictPopplerCompat) {
          delete this.path.GraphicsState.ClippingPath
        }
        this.clippingPath = this.path
        return
      default:
        assertNever(op)
    }
  }

  private apply(op: PathBuilderOperator) {
    if (op.name in PathConstructionOperators) return this.applyPathConstructionOperator(op as PathConstructionOperator)
    if (op.name in PathPaintingOperators) return this.applyPathPaintingOperator(op as PathPaintingOperator)
    if (op.name in ClippingPathOperators) return this.applyClippingPathOperator(op as ClippingPathOperator)
    throw new Error(`AssertionError: unhandled path-builder operator: ${op.name}`)
  }

  private get currentPoint(): [number, number] {
    if (this._currentPoint) return this._currentPoint
    throw new Error('AssertionError: currentPoint is undefined')
  }

  private set currentPoint(point: [number, number]) {
    this._currentPoint = point
  }

  private finishCurrentPath(Closed: boolean) {
    if (this.currentPath.length > 0) {
      this.path.Subpaths.push({
        Type: 'Path',
        Points: this.currentPath,
        Closed,
      })
      this.currentPath = []
    }
  }
}
