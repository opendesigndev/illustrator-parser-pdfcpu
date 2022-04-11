type ICCBased = { Alternate?: string; N: number }
function pickAlternateICCBased(iccBasedParams: ICCBased): string {
  // (Optional) An alternate colour space that shall be used in case the one
  // specified in the stream data is not supported. Non-conforming readers may
  // use this colour space. The alternate space may be any valid colour space
  // (except a Pattern colour space) that has the number of components specified
  // by N. If this entry is omitted and the conforming reader does not understand
  // the ICC profile data, the colour space that shall be used is DeviceGray,
  // DeviceRGB, or DeviceCMYK, depending on whether the value of N is 1, 3, or
  // 4, respectively
  const alternate = iccBasedParams['Alternate']
  if (alternate) return alternate
  const n = iccBasedParams['N']
  if (n === 1) return 'DeviceGray'
  if (n === 3) return 'DeviceRGB'
  if (n === 4) return 'DeviceCMYK'
  console.warn("Couldn't pick appropriate alternative to ICCBased color space:", iccBasedParams)
  return 'DeviceRGB'
}

export type ColorSpace = ['ICCBased', ICCBased] | ['Separation', unknown, string] | ['Pattern'] | string
export function mapAlternate(colorSpace: ColorSpace): string {
  if (typeof colorSpace === 'string')
    // otherwise TS cannot properly eliminate options, since index on string is string
    return colorSpace
  // see 8.6.5.5 ICCBased Colour Spaces
  if (colorSpace[0] === 'ICCBased') {
    return pickAlternateICCBased(colorSpace[1])
  }
  // see 8.6.6.4 Separation Colour Spaces
  if (colorSpace[0] === 'Separation') {
    return colorSpace[2]
  }
  if (colorSpace[0] === 'Pattern') {
    return colorSpace[0]
  }
  return colorSpace
}

function defaultShape(space: string | ColorSpace, val: number): number[] {
  if (space === 'DeviceGray') return [val]
  if (space === 'DeviceCMYK') return [val, val, val, 1.0]
  return [val, val, val]
}

export function defaultColor(space: string | ColorSpace): number[] {
  return defaultShape(space, 0)
}

export function mapAlternateShape(space: string | ColorSpace, vals: number[]): number[] {
  // e.g. with Separation there's only one value instead of 3
  // because we are forcibly mapping it to an alternate space
  if (vals.length === 1) {
    return defaultShape(space, vals[0])
  }
  return vals
}
