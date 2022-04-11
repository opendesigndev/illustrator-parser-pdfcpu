package main

import (
	"errors"
	"io"
	"syscall/js"
)

type Uint8Array struct {
	offset int64
	buf    js.Value
	size   int64
}

func NewUint8ArrayFromGo(bs []byte) *Uint8Array {
	size := int64(len(bs))
	arr := js.Global().Get("Uint8Array").New(size)
	js.CopyBytesToJS(arr, bs)
	return &Uint8Array{
		offset: 0,
		buf:    arr,
		size:   size,
	}
}

func NewUint8ArrayFromJS(arr js.Value) *Uint8Array {
	size := arr.Get("length").Int()
	return &Uint8Array{
		offset: 0,
		buf:    arr,
		size:   int64(size),
	}
}

// Read implements the io.Reader interface.
func (arr *Uint8Array) Read(p []byte) (n int, err error) {
	if arr.offset >= arr.size {
		return 0, io.EOF
	}
	// subarray doesn't allocate memory on JS side
	subarray := arr.buf.Call("subarray", arr.offset, arr.size)
	n = js.CopyBytesToGo(p, subarray)
	arr.offset += int64(n)
	return
}

// Seek implements the io.Seeker interface.
func (arr *Uint8Array) Seek(offset int64, whence int) (int64, error) {
	var abs int64
	switch whence {
	case io.SeekStart:
		abs = offset
	case io.SeekCurrent:
		abs = arr.offset + offset
	case io.SeekEnd:
		abs = arr.size + offset
	default:
		return 0, errors.New("Uint8Array.Seek: invalid whence")
	}
	if abs < 0 {
		return 0, errors.New("Uint8Array.Seek: negative position")
	}
	arr.offset = abs
	return abs, nil

}

func (arr *Uint8Array) ToJS() js.Value {
	return arr.buf
}
