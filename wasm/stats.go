package wasm

import (
	"fmt"
	"runtime"
	"time"
)

// https://github.com/cloudfoundry/bytefmt/blob/master/bytes.go#L8
import (
	"strconv"
	"strings"
)

const (
	BYTE = 1 << (10 * iota)
	KILOBYTE
	MEGABYTE
	GIGABYTE
	TERABYTE
	PETABYTE
	EXABYTE
)

// ByteSize returns a human-readable byte string of the form 10M, 12.5K, and so forth.  The following units are available:
//	E: Exabyte
//	P: Petabyte
//	T: Terabyte
//	G: Gigabyte
//	M: Megabyte
//	K: Kilobyte
//	B: Byte
// The unit that results in the smallest number greater than or equal to 1 is always chosen.
func ByteSize(bytes uint64) string {
	unit := ""
	value := float64(bytes)

	switch {
	case bytes >= EXABYTE:
		unit = "E"
		value = value / EXABYTE
	case bytes >= PETABYTE:
		unit = "P"
		value = value / PETABYTE
	case bytes >= TERABYTE:
		unit = "T"
		value = value / TERABYTE
	case bytes >= GIGABYTE:
		unit = "G"
		value = value / GIGABYTE
	case bytes >= MEGABYTE:
		unit = "M"
		value = value / MEGABYTE
	case bytes >= KILOBYTE:
		unit = "K"
		value = value / KILOBYTE
	case bytes >= BYTE:
		unit = "B"
	case bytes == 0:
		return "0B"
	}

	result := strconv.FormatFloat(value, 'f', 1, 64)
	result = strings.TrimSuffix(result, ".0")
	return result + unit
}

// ENDOF: bytefmt

func ReadAllocs() uint64 {
	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)
	return mem.Alloc
}

type Stats struct {
	labels  []string
	timings []time.Time
	allocs  []uint64
}

func (s *Stats) Observe(label string) {
	s.timings = append(s.timings, time.Now())
	s.allocs = append(s.allocs, ReadAllocs())
	s.labels = append(s.labels, label)
}

func (s Stats) MemHike() uint64 {
	return ReadAllocs() - s.allocs[len(s.allocs)-1]
}

func (s *Stats) Report() {
	numObservations := len(s.labels)
	startTime := s.timings[0]
	durTotal := s.timings[numObservations-1].Sub(startTime).Seconds()

	fmt.Println("Timing:")
	for idx, timing := range s.timings[1:] {
		dur1 := timing.Sub(startTime).Seconds()
		fmt.Printf("%20s                 : %6.3fs  %4.1f%%\n", s.labels[idx+1], dur1, dur1/durTotal*100)
		startTime = timing
	}
	fmt.Printf("total processing time: %6.3fs\n\n", durTotal)

	fmt.Println("Memory statistics:")
	mem1 := s.allocs[0]
	for idx, mem2 := range s.allocs[1:] {
		fmt.Printf("%20s                 : ±%6s (Σ%s)\n", s.labels[idx+1], ByteSize(mem2-mem1), ByteSize(mem2))
		mem1 = mem2
	}
	fmt.Printf("total memory alloc: %s\n\n", ByteSize(mem1-s.allocs[0]))
}
