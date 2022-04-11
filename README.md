# Illustrator Parser - pdfcpu

Adobe Illustrator file parser, targeting both Node.js and browser (via WebAssembly). Uses https://github.com/pdfcpu/pdfcpu internally to parse PDF portion of the file.

# Usage

## Node.js

```typescript
import {
  PrivateData,
  ArtBoardRefs,
  ArtBoard,
} from '@opendesign/illustrator-parser-pdfcpu'
import { FSContext } from '@opendesign/illustrator-parser-pdfcpu/fs_context'

// Will use embedded binary to extract information onto disk
const ctx = await FSContext({ file: '/path/to/illustrator/file' })

// Parses Illustrator file embedded within PDF
const PrivateData = await PrivateData(ctx)

// Returns list of all artboards
const Artboards = await Promise.all(
  ArtBoardRefs(ctx).map((ref) => ArtBoard(ctx, ref))
)
```

## WASM

```typescript
import {
  ArtBoard,
  ArtBoardRefs,
  PrivateData,
} from '@opendesign/illustrator-parser-pdfcpu/dist/index'
import { WASMContext } from '@opendesign/illustrator-parser-pdfcpu/dist/wasm_context'

// file can be obtained from <input type=file>
const contents = new Uint8Array(await file.arrayBuffer())

// will try to run WASM via standard browser/Node.js APIs
const ctx = await WASMContext(data)

// Parses Illustrator file embedded within PDF
const PrivateData = await PrivateData(ctx)

// Returns list of all artboards
const Artboards = await Promise.all(
  ArtBoardRefs(ctx).map((ref) => ArtBoard(ctx, ref))
)
```

# Development

## Code structure

### `wasm`

Contains Go code to parse Illustrator file, dump PDF structure and extract private data.

Right now has two commands, to be used for extracting data from `.ai` file in different contexts:

- `dump-serialized` - targeting native code - will create a new folder in TMPDIR and dump extracted information there. Folder structure:

        /tmp/996617_f752c559434a4109863b6fda349bd304_LaneWebsite2.0_Resources_Blog.ai_214544471
        ├── _contents/
        ├── _private.ai
        ├── bitmaps/
        ├── fonts/
        └── source.json

- `wasm` - targeting browser. When run via `WebAssembly.instantiateStreaming` will allow extracting information from file without server.

#### Environment variables

- `GOGC` - controls how much extra memory will be allocated by Go Garbage Collector. Default is 100 - meaning memory will increase 2x each time. This default works great for most programs, but not for `dump-serialized`, which allocates lots of chunks. To combat that, it runs GC manually every so often during dumping process. Here 20 works best.
- `TMPDIR` - dictates where file will be written. Be advised to move it off RAM when running batch on all test data - there're tens of GBs of files created in that process.

### `src`

Contains Typescript code to parse outputs of Go code into Octpus-compatible format.

Uses `jest` for unit tests, contained in `__test__`.

Public API consists of 3 functions:

- `ArtBoardRefs`,
- `ArtBoard`,
- `PrivateData`,

All of them expect `Context` as argument. Context has to be obtained by parsing `.ai` file with either binary or WASM - see examples above.

For `ArtBoardRefs` and `ArtBoard`, implementation roughly follows the steps:

- obtain refs from PDF XRefTable from Context,
- walk through refs to create a tree,
- traverse the tree parsing nodes containing raw data,
- modify the output to resemble poppler results.

For `PrivateData` Context already has raw bytes representing the data unpacked and ready to scan.
In this case, we read it once for two purposes:

- extract Artboard names (by checking each line for known pattern),
- parse Text layer data - this requires buffering all lines which contain this data, unpacking it and then parsing.

In total, there are three parsers for raw data:

- `src/contents` - parses "XObject" data, described in Section 7.8.2 Content Streams of PDF spec,
- `src/cmap` - parses Font description, from Section 9.7.5 CMaps,
- `src/private-data/text-document` - parses document inside private data describing text layers,

Fist two parsers roughly follow the same pattern: lexer -> operator stacking -> reducer. This works because we don't need tree structre - contents stream is just a list of operators and operands, whilst in cmaps we only need to extract dictionary.
Private data implements entirely different lexer and parser.

### `gulpfile.ts`

Contains some automation for the overall package. Can download test-data, compile Go code and run it on aforementioned test data.

## Dependencies

You might need:

- Node.js - for Typescript and Gulp. Run `npm install` to download deps.
- Go - for `wasm`. `npm run build` will take care of everything.
- Git Large File Storage. Check out [github documentation](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github). When installed run `cat vendor/pdfcpu.git/go.mod` in project root. You should see output with `require` containing links to github packages.

If you have [`nix`](https://nixos.org/learn.html) just run `nix-shell` and you'll have development shell ready :)

## Possible optimizations

- [x] Use symbols instead of `type: number` markers on types - will improve readability of IR,
- [ ] Create symbol for each operator - currently each comparison in `index.ts` does linear equality check for each string,
- [x] Avoid duplicate parsing in decoder (i.e. parseFloat on literal string - maybe some intermediate parsing step?)

## Release process

- ensure new description is added to `CHANGELOG.md` in `Unreleased` section - `kacl` will check this in next step :)

- bump version using `npm version`,

- publish new version with `npm publish`.

## Profiling

### Node.js

- Transpile all files to JS:

        tsc -p .

- Use 0x to create a flamegraph:

        0x ./scripts/parse.js ./test-data/996617_f752c559434a4109863b6fda349bd304_LaneWebsite2.0_Resources_Blog.ai

### Go

- point `AICPU_DUMP_PPROF` to where dump should be created:

        export AICPU_DUMP_PPROF=./prof/

- run dump:

        ./wasm/cmd/dump-serialized/dump-serialized ./test-data/996617_f752c559434a4109863b6fda349bd304_LaneWebsite2.0_Resources_Blog.ai

- analyze with

        go tool pprof -http=":8081" ./wasm/cmd/dump-serialized/dump-serialized ./pprof/cpu.pprof
