package wasm

import (
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu"
)

const VERSION = "0.11.0"

type SerializedFile struct {
	XRefTable pdfcpu.XRefTable
	Version   string
}

func serialize(ctx *pdfcpu.Context) (*SerializedFile, error) {
	var serialized SerializedFile
	serialized.Version = VERSION
	serialized.XRefTable = *ctx.XRefTable                             // copy top-level
	serialized.XRefTable.Table = make(map[int]*pdfcpu.XRefTableEntry) // avoid copying reference to map

	for objId, obj := range ctx.XRefTable.Table {
		if obj != nil {
			dict, isDict := obj.Object.(pdfcpu.StreamDict)
			if isDict {
				dict.Raw = nil
				objCopy := *obj
				objCopy.Object = dict
				serialized.XRefTable.Table[objId] = &objCopy
			} else {
				serialized.XRefTable.Table[objId] = obj
			}
		}
	}
	return &serialized, nil
}
