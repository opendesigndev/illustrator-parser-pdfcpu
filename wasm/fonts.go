package wasm

import (
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu"
)

type Fonts map[int]*pdfcpu.Font

func extractFonts(ctx *pdfcpu.Context) (fs Fonts, err error) {
	fs = make(Fonts)
	for objNr := range ctx.Optimize.FontObjects {
		font, err := ctx.ExtractFont(objNr)
		if err != nil {
			return fs, err
		}
		if font != nil {
			fs[objNr] = font
		}
	}
	return
}
