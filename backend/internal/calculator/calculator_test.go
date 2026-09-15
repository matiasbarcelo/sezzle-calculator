package calculator

import (
	"errors"
	"math"
	"testing"
)

func ptr(f float64) *float64 { return &f }

func TestCalculate(t *testing.T) {
	tests := []struct {
		name string
		op   string
		a    float64
		b    *float64
		want float64
	}{
		{"add", Add, 2, ptr(3), 5},
		{"add negatives", Add, -2.5, ptr(-1.5), -4},
		{"subtract", Subtract, 10, ptr(4), 6},
		{"subtract below zero", Subtract, 3, ptr(5), -2},
		{"multiply", Multiply, 6, ptr(7), 42},
		{"multiply by zero", Multiply, 123, ptr(0), 0},
		{"divide", Divide, 10, ptr(4), 2.5},
		{"divide zero by number", Divide, 0, ptr(5), 0},
		{"power", Power, 2, ptr(10), 1024},
		{"power zero exponent", Power, 5, ptr(0), 1},
		{"power fractional", Power, 9, ptr(0.5), 3},
		{"power negative exponent", Power, 2, ptr(-2), 0.25},
		{"sqrt", Sqrt, 16, nil, 4},
		{"sqrt zero", Sqrt, 0, nil, 0},
		{"sqrt ignores b", Sqrt, 25, ptr(99), 5},
		{"percentage", Percent, 5, ptr(200), 10},
		{"percentage fractional", Percent, 21, ptr(1000), 210},
		{"remainder", Remainder, 10, ptr(3), 1},
		{"remainder negative dividend", Remainder, -10, ptr(3), -1},
		{"remainder fractional", Remainder, 5.5, ptr(2), 1.5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculate(tt.op, tt.a, tt.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if math.Abs(got-tt.want) > 1e-9 {
				t.Errorf("got %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCalculateErrors(t *testing.T) {
	tests := []struct {
		name string
		op   string
		a    float64
		b    *float64
		want error
	}{
		{"unknown op", "modulo", 1, ptr(2), ErrUnknownOperation},
		{"missing b", Add, 1, nil, ErrMissingOperand},
		{"divide by zero", Divide, 1, ptr(0), ErrDivisionByZero},
		{"remainder by zero", Remainder, 1, ptr(0), ErrDivisionByZero},
		{"sqrt negative", Sqrt, -4, nil, ErrNegativeSqrt},
		{"overflow", Multiply, math.MaxFloat64, ptr(10), ErrNotFinite},
		{"negative base fractional power", Power, -8, ptr(0.5), ErrNotFinite},
		{"power overflow", Power, 10, ptr(400), ErrNotFinite},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := Calculate(tt.op, tt.a, tt.b)
			if !errors.Is(err, tt.want) {
				t.Errorf("got error %v, want %v", err, tt.want)
			}
		})
	}
}
