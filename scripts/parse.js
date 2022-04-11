import { ArtBoardRefs, ArtBoard, PrivateData, } from "../dist/index.mjs"
import { readFile, stat, rm } from 'fs/promises'
import { argv, stdout, exit, env } from 'process';
import { diffJson } from 'diff'
import chalk from 'chalk'
import { dirname, join, basename } from 'path'
// import { normalize } from "../src/compare"
import { FSContext } from "../dist/fs_context.mjs";
import { WASMContext } from "../dist/wasm_context.mjs";
import { getEntries } from "marky";

async function fileSize(path) {
    const { size } = await stat(path)
    return humanFileSize(size)
}

const ONE_GIGABYTE = 1024 * 1024 * 1024
let visited = new Set()
async function parse(file) {
    let ctx
    if (env['USE_WASM']) {
        const data = await readFile(file)
        if (data.length > ONE_GIGABYTE) {
            console.warn("file larger than 1GB, skipping...")
            return []
        }
        ctx = await WASMContext(data)
    } else {
        ctx = await FSContext({ file })
        ctx.streamDict = async (num) => {
            if (visited.has(num)) {
                console.warn('double parse on', num)
            }
            const fileName = ctx.StreamDicts[num]
            if (!fileName) {
                throw new Error(`AssertionError: path for ObjID ${num} doesn't exist`)
            }
            const path = join(ctx.BaseDir, fileName)
            if (env['VERBOSE']) {
                console.log(path, 'size:', await fileSize(path))
            }
            visited.add(num)
            return readFile(path)
        }
        console.log(ctx.PrivateData, 'size:', await fileSize(ctx.PrivateData))
    }
    ctx.strictPopplerCompat = env['DISABLE_STRICT_POPPLER_COMPAT'] ? undefined : true

    await PrivateData(ctx)

    const artboards = await Promise.all(ArtBoardRefs(ctx).map((ref) => ArtBoard(ctx, ref)))

    if (ctx.BaseDir)
        await rm(ctx.BaseDir, { recursive: true })

    return artboards
}

function humanFileSize(size) {
    var i = Math.floor(Math.log(size) / Math.log(1024));
    const abbrev = chalk.underline((size / Math.pow(1024, i)).toFixed(2))
    const suffix = [chalk.gray('B'), chalk.green('kB'), chalk.blue('MB'), chalk.yellow('GB'), chalk.red('TB')][i]
    return `${abbrev}${suffix}`
}

const fileName = argv[2]

function normalizePath(path) {
    if (path.endsWith('/')) {
        return path.slice(0, path.length - 1)
    }
    return path
}

function findExpectedDir(path) {
    let baseFileName = ''
    if (fileName.endsWith('.ai')) {
        baseFileName = basename(fileName, '.ai')

    } else {
        baseFileName = basename(dirname(fileName))
        baseFileName = baseFileName.slice(0, baseFileName.length - 13)
    }
    let expectedDir = normalizePath(path)
    if (!(expectedDir.endsWith(baseFileName))) {
        expectedDir = join(expectedDir, baseFileName)
    }
    return expectedDir
}

function printWholeDiff(diff) {
    diff.forEach((part) => {
        // blue = should be there, but is missing
        // yellow = is there, but shouldn't
        const color = part.added ? 'blue' :
            part.removed ? 'yellow' : 'grey'
        if (part.added || part.removed)
            stdout.write(chalk[color]("±"))
        stdout.write(chalk[color](part.value))
    })
    // newline since diff might not have it
    console.log()
}

function printChanged(diff) {
    diff.forEach((part) => {
        if (!(part.added || part.removed))
            return
        // blue = should be there, but is missing
        // yellow = is there, but shouldn't
        const color = part.added ? 'blue' : 'yellow'
        stdout.write(chalk[color](part.value))
    })
    // newline since diff might not have it
    console.log()
}

async function diffOrPrint(path, val) {
    if (path) {
        const expectedDir = findExpectedDir(path)
        const expectedPages = await Promise.all(val.map(async (_, idx) => {
            const path = join(expectedDir, `${idx + 1}.json`)
            return JSON.parse(await readFile(path, { encoding: 'utf-8' }))
        }))
        let retValue = 0
        val.forEach((page, idx) => {
            const expectedPage = expectedPages[idx]
            // TODO: make it work with ESM
            // const diff = diffJson(normalize(page), normalize(expectedPage))
            const diff = diffJson(page, expectedPage)
            const verbosity = env['VERBOSE']
            if (verbosity === 'all') {
                printWholeDiff(diff)
            } else if (verbosity) {
                printChanged(diff)
            }
            retValue ||= diff.map((part) => (part.added || part.removed) ? 1 : 0).reduce((a, b) => a + b)
        })
        console.log('found differences:', !!(retValue))
        exit(retValue)
    } else {
        val.forEach(page => {
            if (env['VERBOSE']) {
                console.log(JSON.stringify(val, null, "\t"))
            }

            const size = JSON.stringify(val).length
            console.log(page.Name, 'size:', humanFileSize(size))
        });
    }
}

parse(fileName).then(async (val) => diffOrPrint(argv[3], val)).then(() => {
    console.log(getEntries())
})
