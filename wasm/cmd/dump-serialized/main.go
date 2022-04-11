package main

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path"
	"runtime"
	"strconv"
	"sync"

	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu"
	"github.com/pkg/errors"
	"github.com/pkg/profile"
	"github.com/opendesigndev/illustrator-parser-pdfcpu/wasm"
)

type Dump struct {
	*wasm.SerializedFile
	StreamDicts map[int]string
	Bitmaps     map[int]string
	Fonts       map[int]string
	PrivateData string
}

func dumpPrivate(parent string, data wasm.PrivateData) (string, error) {
	defer data.Close()

	f, err := os.Create(path.Join(parent, "_private.ai"))
	if err != nil {
		return "", errors.Wrapf(err, "failed opening tmpfile")
	}
	for {
		ok := data.Scan()
		if !ok {
			err := data.Err()
			if err != nil {
				return "", errors.Wrapf(err, "reading line")
			}
			break
		}
		if _, err := f.Write(append(data.Bytes(), byte('\r'))); err != nil {
			return "", errors.Wrapf(err, "failed writing file %s", f.Name())
		}
	}
	return f.Name(), nil
}

type dumpImage struct {
	parent string
	objNr  int
	ir     wasm.ImageReader
}

func (params dumpImage) Do(ctx *Ctx) Result {
	img, err := params.ir.Read()
	if err != nil {
		return Result{err: errors.Wrapf(err, "failed decoding image")}
	}
	f, err := os.Create(path.Join(params.parent, fmt.Sprintf("%d.%s", params.objNr, img.Ext)))
	if err != nil {
		return Result{err: errors.Wrapf(err, "failed opening tmpfile")}
	}
	defer f.Close()
	if _, err := f.Write(img.Content); err != nil {
		return Result{err: errors.Wrapf(err, "while writing image")}
	}
	return Result{fName: f.Name(), objNr: params.objNr}
}

func dumpFont(parent string, objNr int, font *pdfcpu.Font) (string, error) {
	f, err := os.Create(path.Join(parent, fmt.Sprintf("%d.%s", objNr, font.Type)))
	if err != nil {
		return "", errors.Wrapf(err, "failed opening tmpfile")
	}
	defer f.Close()
	if _, err := io.Copy(f, font); err != nil {
		return f.Name(), errors.Wrapf(err, "while writing font")
	}
	return f.Name(), nil
}

func dumpStreamDict(parent string, objId int, dict *pdfcpu.StreamDict) (string, error) {
	f, err := os.Create(path.Join(parent, fmt.Sprintf("%d", objId)))
	if err != nil {
		return "", errors.Wrapf(err, "failed opening tmpfile")
	}
	defer f.Close()
	if err := dict.Decode(); err != nil {
		return f.Name(), errors.Wrapf(err, "while parsing dict contents")
	}
	if _, err := f.Write(dict.Content); err != nil {
		return f.Name(), errors.Wrapf(err, "while writing dict contents")
	}
	return f.Name(), nil
}

const BITMAP_SUBDIR = "bitmaps"
const FONT_SUBDIR = "fonts"
const STREAM_CONTENTS_SUBDIR = "_contents"

type Result struct {
	fName string
	err   error
	objNr int
}

type Worker interface {
	Do(*Ctx) Result
}

type Ctx struct {
	dir   string
	stats wasm.Stats

	bitmapDir  string
	numBitmaps int

	fontDir  string
	numFonts int

	streamContentDir  string
	numStreamContents int

	workers chan Worker
	results chan Result

	D Dump
}

func newCtx(base string, data *wasm.SerializedFile) (*Ctx, error) {
	dir, err := ioutil.TempDir("", fmt.Sprintf("%s_*", base))
	if err != nil {
		return nil, errors.Wrapf(err, "failed opening tmpdir")
	}
	numWorkers := runtime.GOMAXPROCS(0) // configurable by GOMAXPROCS env var
	ctx := Ctx{
		dir:              dir,
		stats:            wasm.Stats{},
		bitmapDir:        path.Join(dir, BITMAP_SUBDIR),
		fontDir:          path.Join(dir, FONT_SUBDIR),
		streamContentDir: path.Join(dir, STREAM_CONTENTS_SUBDIR),
		workers:          make(chan Worker, numWorkers),
		results:          make(chan Result, numWorkers),
		D:                Dump{data, make(map[int]string), make(map[int]string), make(map[int]string), ""},
	}
	if err := os.MkdirAll(ctx.bitmapDir, 0750); err != nil {
		return nil, errors.Wrapf(err, "failed creating subdir")
	}
	if err := os.MkdirAll(ctx.streamContentDir, 0750); err != nil {
		return nil, errors.Wrapf(err, "failed creating subdir")
	}
	if err := os.MkdirAll(ctx.fontDir, 0750); err != nil {
		return nil, errors.Wrapf(err, "failed creating subdir")
	}
	for w := 0; w < numWorkers; w++ {
		go func() {
			for j := range ctx.workers {
				ctx.results <- j.Do(&ctx)
			}
		}()
	}

	return &ctx, nil
}

func (ctx *Ctx) Close() {
	if ctx.numBitmaps == 0 {
		os.Remove(ctx.bitmapDir)
	}
	if ctx.numStreamContents == 0 {
		os.Remove(ctx.streamContentDir)
	}
	if ctx.numFonts == 0 {
		os.Remove(ctx.fontDir)
	}
}

func (ctx *Ctx) dumpBitmaps(bitmaps wasm.Bitmaps) error {
	var wg sync.WaitGroup
	wg.Add(1)
	var errs []error
	go func() {
		defer wg.Done()
		for range bitmaps {
			r := <-ctx.results
			if r.err != nil {
				errs = append(errs, r.err)
			}
			ctx.D.Bitmaps[r.objNr] = path.Join(BITMAP_SUBDIR, path.Base(r.fName))
			ctx.numBitmaps += 1
		}
	}()
	for objNr, obj := range bitmaps {
		ctx.workers <- dumpImage{ctx.bitmapDir, objNr, obj}
	}
	wg.Wait()
	if len(errs) > 0 {
		return errors.Wrapf(errs[0], "failed decoding images (total of %d errors)", len(errs))
	}
	return nil
}

func (ctx *Ctx) dumpFonts(fonts wasm.Fonts) error {
	for objNr, obj := range fonts {
		fName, err := dumpFont(ctx.fontDir, objNr, obj)
		if err != nil {
			return errors.Wrap(err, "failed writing font")
		}
		ctx.D.Fonts[objNr] = path.Join(FONT_SUBDIR, path.Base(fName))
		ctx.numFonts += 1
	}
	return nil
}

func (ctx *Ctx) dumpStreamDicts(streamDicts wasm.StreamDicts) error {
	for objNr, dict := range streamDicts {
		fName, err := dumpStreamDict(ctx.streamContentDir, objNr, dict)
		if err != nil {
			return err
		}
		ctx.D.StreamDicts[objNr] = path.Join(STREAM_CONTENTS_SUBDIR, path.Base(fName))
		ctx.numStreamContents += 1
		// Interesting read on tweaking current GC (go version go1.16.13 linux/amd64)
		// https://docs.google.com/document/d/1zn4f3-XWmoHNj702mCCNvHqaS7p9rzqQGa74uOwOBKM/mobilebasic#id.53cfher2l1xx
		if ctx.stats.MemHike() > 256*wasm.MEGABYTE {
			ctx.stats.Observe(fmt.Sprintf("at %d - before GC", objNr))
			runtime.GC()
			ctx.stats.Observe(fmt.Sprintf("at %d - after GC", objNr))
		}
	}
	return nil
}

func dump(base string, data *wasm.IllustratorFile) error {
	ctx, err := newCtx(base, data.SerializedFile)
	if err != nil {
		return errors.Wrap(err, "failed creating context")
	}
	defer ctx.Close()
	f, err := os.Create(path.Join(ctx.dir, "source.json"))
	if err != nil {
		return errors.Wrap(err, "failed opening source.json for writing")
	}
	runtime.GC()
	ctx.stats.Observe("start")
	if err := ctx.dumpBitmaps(data.Bitmaps); err != nil {
		return err
	}
	ctx.stats.Observe("bitmaps")
	if err := ctx.dumpFonts(data.Fonts); err != nil {
		return err
	}
	ctx.stats.Observe("fonts")
	if err := ctx.dumpStreamDicts(data.StreamDicts); err != nil {
		return err
	}
	ctx.stats.Observe("stream dicts")
	if privateFile, err := dumpPrivate(ctx.dir, data.PrivateData); err != nil {
		return errors.Wrapf(err, "while dumping private data")
	} else {
		ctx.D.PrivateData = privateFile
	}
	ctx.stats.Observe("private data")
	if err := json.NewEncoder(f).Encode(ctx.D); err != nil {
		return errors.Wrapf(err, "while serializing to JSON")
	}
	ctx.stats.Observe("encode")
	fmt.Println("wrote", f.Name())
	ctx.stats.Report()
	return nil
}

func run(conf *wasm.Configuration, files ...string) (exitCode int) {
	pprof := os.Getenv("AICPU_DUMP_PPROF")
	if len(pprof) != 0 {
		defer profile.Start(profile.CPUProfile, profile.ProfilePath(pprof)).Stop()
	}

	for _, file := range files {
		fmt.Printf("parsing %s ...\n", file)
		data, err := wasm.ParseFile(file, conf)
		if err != nil {
			fmt.Println(err)
			return 1
		}
		if err := dump(path.Base(file), data); err != nil {
			fmt.Println(err)
			return 2
		}
	}

	return
}

func main() {
	conf := wasm.NewConfiguration()
	conf.WithPrivateData = true

	bufferSize, err := strconv.Atoi(os.Getenv("AICPU_WASM_BUFFER_SIZE"))
	if err == nil {
		wasm.BufferSize = bufferSize
	} else {
		wasm.BufferSize = 512 * 1024 * 1024
	}

	if len(os.Args) < 2 {
		os.Exit(127) // TODO: Notify about usage?
	}

	os.Exit(run(conf, os.Args[1:]...))
}
