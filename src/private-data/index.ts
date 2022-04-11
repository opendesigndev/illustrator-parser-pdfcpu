import { mark, stop } from 'marky'
import { PrivateData, RawPrivateData } from './interfaces'
import { Parser } from './parser'

export async function parsePrivateData(data: RawPrivateData): Promise<PrivateData> {
  mark('PrivateData')
  const privateData = await new Parser().extract(data)
  stop('PrivateData')
  return privateData
}
