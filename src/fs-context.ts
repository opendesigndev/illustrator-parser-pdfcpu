import { readFile } from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import { mark, stop } from 'marky'
import { Context } from './interfaces'
import { lineReader } from './utils/line-reader'

const execFilePromise = promisify(execFile)

export interface DumpSerializedOpts {
  file: string
  workdir?: string
}

async function dumpSerialized({ file, workdir }: DumpSerializedOpts): Promise<string> {
  mark('dump serialized')
  const { stdout } = await execFilePromise(new URL('dump-serialized', import.meta.url).pathname, [file], {
    encoding: 'utf-8',
    env: {
      ...process.env,
      TMPDIR: workdir,
    },
  })
  stop('dump serialized')
  for (const line of stdout.split('\n')) {
    if (line.startsWith('wrote ')) return line.slice('wrote '.length)
  }
  throw new Error('failed to find written file')
}

export interface FsContext extends Context {
  Bitmaps: { [key: string]: string }
  Fonts: { [key: string]: string }
  StreamDicts: { [key: string]: string }
  BaseDir: string
  PrivateData: string
}

export async function FSContext(opts: DumpSerializedOpts): Promise<FsContext> {
  const source = await dumpSerialized(opts)
  const BaseDir = path.dirname(source)
  const metadataRaw = await readFile(source, 'utf8')
  const aiFile = JSON.parse(metadataRaw)
  const Fonts = aiFile.Fonts
  const Bitmaps = aiFile.Bitmaps
  const StreamDicts = aiFile.StreamDicts
  const PrivateData = aiFile.PrivateData

  const externalResourceURLs = {
    Bitmaps: Bitmaps,
    Fonts: Fonts,
  }

  return {
    aiFile,
    privateData: () => lineReader(PrivateData),
    streamDict: (num: number) => readFile(path.join(BaseDir, StreamDicts[num])),
    externalResourceURLs,
    xobjectMutex: new Map(),
    fontCache: new Map(),
    strictPopplerCompat: true,
    BaseDir,
    Fonts,
    Bitmaps,
    StreamDicts,
    PrivateData,
  }
}
