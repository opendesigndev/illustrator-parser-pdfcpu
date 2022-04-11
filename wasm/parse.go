package wasm

import (
	"fmt"
	"io"
	"os"

	"github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu"
	"github.com/pkg/errors"
)

type IllustratorFile struct {
	PrivateData    PrivateData
	SerializedFile *SerializedFile
	Bitmaps        Bitmaps
	Fonts          Fonts
	StreamDicts    StreamDicts
}

type Configuration struct {
	pdfcpu.Configuration
	// PrivateData must be explicitly closed if requested, otherwise decompress will leak memory
	WithPrivateData bool
}

func Parse(rs io.ReadSeeker, conf *Configuration) (*IllustratorFile, error) {
	var ret IllustratorFile
	var s Stats
	s.Observe("start")
	defer s.Report()

	ctx, err := api.ReadContext(rs, &conf.Configuration)
	if err != nil {
		return &ret, errors.WithMessage(err, "while opening read context")
	}
	s.Observe("read")

	if err = api.ValidateContext(ctx); err != nil {
		s := ""
		if conf.ValidationMode == pdfcpu.ValidationStrict {
			s = " (try -mode=relaxed)"
		}
		err = errors.Wrap(err, fmt.Sprintf("validation error (obj#:%d)%s", ctx.CurObj, s))
	}
	if err != nil {
		return nil, errors.WithMessage(err, "whilst validating")
	}
	s.Observe("validate")

	if conf.WithPrivateData {
		ret.PrivateData, err = extractPrivateData(ctx)
		s.Observe("private data")
	}

	if err != nil {
		return nil, errors.WithMessage(err, "whilst extracting private data")
	}

	ret.StreamDicts, ret.Bitmaps, err = extractStreamDicts(ctx)
	s.Observe("extract stream dicts")

	if err != nil {
		return nil, errors.WithMessage(err, "whilst extracting stream dicts")
	}

	// NOTE: breaks parsing private data because it removes Illustrator comments - it has to happen _after_ private data extraction
	err = api.OptimizeContext(ctx)
	s.Observe("optimize")

	if err != nil {
		return nil, errors.WithMessage(err, "whilst opening optimization context")
	}

	ret.Fonts, err = extractFonts(ctx)
	s.Observe("extract fonts")

	if err != nil {
		return nil, errors.WithMessage(err, "whilst extracting fonts")
	}

	ret.SerializedFile, err = serialize(ctx)
	s.Observe("serialize")

	if err != nil {
		return nil, errors.WithMessage(err, "whilst serializing final structure")
	}

	return &ret, err
}

func NewConfiguration() *Configuration {
	pdfcpu.ConfigPath = "disable"
	api.DisableConfigDir()

	conf := Configuration{*pdfcpu.NewDefaultConfiguration(), false}
	return &conf
}

func ParseFile(inFile string, conf *Configuration) (*IllustratorFile, error) {
	f, err := os.Open(inFile)
	if err != nil {
		return nil, err
	}

	defer f.Close()

	ret, err := Parse(f, conf)
	if err != nil {
		return nil, err
	}

	return ret, nil
}
