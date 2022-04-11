import { readdir, readFile, access } from 'fs/promises';
import { constants } from 'fs'
const F_OK = constants.F_OK
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
const execFilePromise = promisify(execFile)
import { cpus } from 'os';
import { join } from 'path'
import asyncPool from 'tiny-async-pool'
import path from 'path'
import process from 'process'

import { task } from "hereby"

async function goBuildDumpSerialized(target, GOOS, GOARCH) {
  await execFilePromise('go', [
    'build',
    '-o',
    target
  ], {
    cwd: './wasm/cmd/dump-serialized/',
    env: {
      GOOS,
      GOARCH,
      CGO_ENABLED: '0',
      ...process.env,
    }
  },
  )
}

export const compileDumpSerialized = task({
  name: 'compileDumpSerialized',
  description: 'compile Go helper for fs-context',
  run: () => goBuildDumpSerialized('dump-serialized')
})

async function goBuildWasm(target) {
  await execFilePromise('go', [
    'build',
    '-o',
    target
  ], {
    cwd: './wasm/cmd/wasm/',
    env: {
      GOOS: "js",
      GOARCH: "wasm",
      ...process.env,
    }
  })
}

async function getTestData() {
  const dir = process.env['TEST_DATA_DIR'] || './test-data/'
  const allFiles = await readdir(dir);
  return allFiles.filter((fname) => fname.endsWith(".ai")).map((fname) => join(dir, fname))
}

export const downloadTestData = task({
  name: 'downloadTestFiles',
  description: 'download test files',
  run: runDownloadTestData
})

async function runDownloadTestData() {
  await execFilePromise('mkdir', ['-p', 'test-data'])
  const file = await readFile("./test_files.csv", { encoding: 'utf-8' })
  const urls = file.split("\n").map(line => line.trim()).filter(line => line.length > 0)
  const fname = (url) => "./test-data/" + url.split("/").slice(-3).join("_")
  const exists = (path) => access(path, F_OK).then(() => true).catch(() => false)
  const run = async (url) => {
    const f = fname(url)
    if (! await exists(f)) {
      console.log("Downloading", url)
      try {
        await (execFilePromise('wget', [url, '-O', f, '-o', `${f}.log`]))
        return true
      } catch {
        await (execFilePromise('rm', ['-f', f]))

        const log = await readFile(`${f}.log`, { encoding: 'utf-8' })
        throw new Error(log)
      }
    } else {
      return false
    }
  }
  let totalDownloads = 0
  for await (const downloaded of asyncPool(cpus().length, urls, run)) {
    totalDownloads += downloaded ? 1 : 0
  }
  console.log("downloaded", totalDownloads, "new files")
}

export const dist = task({
  name: 'dist',
  description: "compile all files for dist/",
  run: runDist
})
export default dist

const TARGETS = [
  ['darwin', 'amd64'],
  ['darwin', 'arm64'],
  ['linux', 'amd64'],
  // ['windows', 'amd64'],
]
async function runDist() {
  const dist = path.resolve("./dist")
  Promise.all(TARGETS.map(async target => {
    const [GOOS, GOARCH] = target
    await goBuildDumpSerialized(path.join(dist, `dump-serialized_${GOOS}_${GOARCH}`), GOOS, GOARCH)
  }))
  await goBuildWasm(path.join(dist, 'aicpu.wasm'))
  await execFilePromise('rollup', ['-c', '-m'])
}

export const parseAll = task({
  name: "parseAll",
  description: "run scripts/parse on all test files",
  dependencies: [dist, compileDumpSerialized, downloadTestData],
  run: runParse
})


async function runParse() {
  const files = await getTestData()
  const expected = process.env.EXPECTED_DIR
  for (const file of files) {
    console.log({ file })
    const args = ['run', '--silent', 'parse', '--', file]
    if (expected)
      args.push(expected)
    const parse = spawn('npm', args, { timeout: 600 * 1000, stdio: 'inherit' })
    await (new Promise((res, rej) => parse.once('exit', (exit, signal) => {
      if (signal) {
        console.log("killed by", { signal })
        rej({ signal })
      }
      if (exit != 0)
        rej({ exit })
      res(true)
    })))
  }
}
