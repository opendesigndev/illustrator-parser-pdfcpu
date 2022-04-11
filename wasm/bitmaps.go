package wasm

import (
	"bytes"
	"image/png"
	"io"

	"github.com/hhrutter/tiff"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu"
	"github.com/pkg/errors"
)

type Image struct {
	Ext     string
	Content []byte
}

func dumpImage(xRefTable *pdfcpu.XRefTable, objNr int, sd pdfcpu.StreamDict) (img Image, err error) {
	if err := sd.Decode(); err != nil {
		return img, errors.Wrapf(err, "while parsing dict contents")
	}
	ir, ext, err := pdfcpu.RenderImage(xRefTable, &sd, false /* not a thumbnail */, "", objNr)
	if err != nil {
		return img, errors.Wrapf(err, "failed decoding image")
	}
	if ext == "" {
		return img, nil
	}

	buf := bytes.NewBuffer(nil)
	if ext == "tiff" { // TODO: discuss with guys if this conversion is needed
		ext = "png"
		dec, err := tiff.Decode(ir)
		if err != nil {
			return img, errors.Wrapf(err, "while decoding tiff")
		}
		if err := png.Encode(buf, dec); err != nil {
			return img, errors.Wrapf(err, "while encoding png")
		}
	} else {
		// can be png, jpg, jpx; see pdfcpu.RenderImage
		if _, err := io.Copy(buf, ir); err != nil {
			return img, errors.Wrapf(err, "while writing image")
		}
	}

	img.Ext = ext
	img.Content = buf.Bytes()
	return
}

type ImageReader interface {
	Read() (Image, error)
}

type imageReader struct {
	xRefTable *pdfcpu.XRefTable
	objNr     int
	sd        pdfcpu.StreamDict
}

func (ctx *imageReader) Read() (Image, error) {
	return dumpImage(ctx.xRefTable, ctx.objNr, ctx.sd)
}
