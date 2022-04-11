package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"runtime/debug"
	"strconv"
	"syscall/js"

	"github.com/pkg/errors"
	"github.com/opendesigndev/illustrator-parser-pdfcpu/wasm"
)

// https://withblue.ink/2020/10/03/go-webassembly-http-requests-and-promises.html
func Promisify(f func() (interface{}, error)) js.Value {
	handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		resolve := args[0]
		reject := args[1]

		go func() {
			val, err := f()
			if err != nil {
				reject.Invoke(err.Error())
			} else {
				resolve.Invoke(val)
			}
		}()
		return nil
	})
	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.New(handler)
}

func bitmapFetchers(bitmaps wasm.Bitmaps) (funcs map[string]interface{}) {
	funcs = make(map[string]interface{})
	for objNr, img := range bitmaps {
		idx := fmt.Sprintf("%d", objNr)
		img := img
		funcs[idx] = js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			return Promisify(func() (interface{}, error) {
				img, err := img.Read()
				if err != nil {
					return "", err
				}
				return map[string]interface{}{
					"name":    fmt.Sprintf("%d.%s", objNr, img.Ext),
					"mime":    fmt.Sprintf("image/%s", img.Ext),
					"content": NewUint8ArrayFromGo(img.Content).ToJS(),
				}, nil
			})
		})
	}
	return
}

func fontFetchers(fonts wasm.Fonts) (funcs map[string]interface{}) {
	funcs = make(map[string]interface{})
	for objNr, font := range fonts {
		idx := fmt.Sprintf("%d", objNr)
		font := font
		funcs[idx] = js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			return Promisify(func() (interface{}, error) {
				bytes, err := ioutil.ReadAll(font)
				if err != nil {
					return "", err
				}
				return map[string]interface{}{
					"name":    font.Name,
					"type":    font.Type,
					"content": NewUint8ArrayFromGo(bytes).ToJS(),
				}, nil
			})
		})
	}
	return
}

func streamDictFetcherWrapper(dicts wasm.StreamDicts) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		return Promisify(func() (interface{}, error) {
			if len(args) != 1 {
				return nil, fmt.Errorf("Invalid no of arguments passed: %d", len(args))
			}
			dict := dicts[args[0].Int()]
			if err := dict.Decode(); err != nil {
				return nil, err
			}
			data := dict.Content
			return NewUint8ArrayFromGo(data).ToJS(), nil
		})
	})
}

// https://javascript.info/async-iterators-generators
func next(priv wasm.PrivateData) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		return Promisify(func() (interface{}, error) {
			buffer := bytes.NewBuffer([]byte{})
			ok := true
			for i := 0; i < 100; i += 1 {
				ok = priv.Scan()
				if !ok {
					err := priv.Err()
					if err != nil {
						return nil, errors.Wrapf(err, "reading line")
					}
				}
				buffer.Write(append(priv.Bytes(), '\r'))
				if !ok {
					break
				}
			}
			return map[string]interface{}{
				"done":  !ok,
				"value": NewUint8ArrayFromGo(buffer.Bytes()).ToJS(),
			}, nil
		})
	})
}

func jsWrapper(this js.Value, args []js.Value) interface{} {
	return Promisify(func() (interface{}, error) {
		if len(args) != 1 {
			return nil, fmt.Errorf("Invalid no of arguments passed: %d", len(args))
		}

		conf := wasm.NewConfiguration()
		conf.WithPrivateData = true

		data, err := wasm.Parse(NewUint8ArrayFromJS(args[0]), conf)
		if err != nil {
			fmt.Printf("unable to parse: %s\n", err)
			return nil, err
		}
		bs, err := json.Marshal(data.SerializedFile)
		if err != nil {
			fmt.Printf("unable to serialize: %s\n", err)
			return nil, err
		}
		return map[string]interface{}{
			"value": string(bs),
			"privateData": map[string]interface{}{
				"next": next(data.PrivateData),
			},
			"streamDict": streamDictFetcherWrapper(data.StreamDicts),
			"bitmaps":    bitmapFetchers(data.Bitmaps),
			"fonts":      fontFetchers(data.Fonts),
		}, nil
	})
}

func main() {
	debug.SetGCPercent(20)
	bufferSize, err := strconv.Atoi(os.Getenv("BUFFER_SIZE"))
	if err == nil {
		wasm.BufferSize = bufferSize
	} else {
		wasm.BufferSize = 512 * 1024 * 1024
	}
	exit := make(chan bool)
	js.Global().Set("IllustratorParser", map[string]interface{}{
		"parse": js.FuncOf(jsWrapper),
		"exit": js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			exit <- true
			return nil
		}),
		"bufferSize": bufferSize,
	})
	<-exit
}
