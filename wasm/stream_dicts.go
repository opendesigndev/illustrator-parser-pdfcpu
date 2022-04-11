package wasm

import (
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu"
)

type StreamDicts map[int]*pdfcpu.StreamDict
type Bitmaps map[int]ImageReader

func extractStreamDicts(ctx *pdfcpu.Context) (scs StreamDicts, bs Bitmaps, err error) {
	scs = make(StreamDicts)
	bs = make(Bitmaps)
	for objId, obj := range ctx.XRefTable.Table {
		if obj != nil {
			dict, isDict := obj.Object.(pdfcpu.StreamDict)
			if isDict {
				if subtype := dict.Dict.NameEntry("Subtype"); subtype != nil && *subtype == "Image" {
					bs[objId] = &imageReader{ctx.XRefTable, objId, dict}
				} else {
					scs[objId] = &dict
				}
			}
		}
	}
	return
}
