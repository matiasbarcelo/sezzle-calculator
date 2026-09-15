// Package calculator implements the arithmetic behind the calculator API.
// It has no HTTP concerns so it can be tested and reused on its own.
package calculator

import (
	"errors"
	"math"
)

// Operation names accepted by Calculate.
const (
	Add       = "add"
	Subtract  = "subtract"
	Multiply  = "multiply"
	Divide    = "divide"
	Power     = "power"
	Sqrt      = "sqrt"
	Percent   = "percentage"
	Remainder = "remainder"
)

var (
	ErrUnknownOperation = errors.New("unknown operation")
	ErrMissingOperand   = errors.New("operation requires operand b")
	ErrDivisionByZero   = errors.New("division by zero")
	ErrNegativeSqrt     = errors.New("square root of a negative number")
	ErrNotFinite        = errors.New("result is not a finite number")
)

// binary reports whether an operation needs a second operand.
var binary = map[string]bool{
	Add:       true,
	Subtract:  true,
	Multiply:  true,
	Divide:    true,
	Power:     true,
	Sqrt:      false,
	Percent:   true,
	Remainder: true,
}

// Operations lists every supported operation name.
func Operations() []string {
	return []string{Add, Subtract, Multiply, Divide, Power, Sqrt, Percent, Remainder}
}

// IsBinary reports whether op takes two operands. ok is false for unknown ops.
func IsBinary(op string) (isBinary, ok bool) {
	isBinary, ok = binary[op]
	return isBinary, ok
}

// Calculate applies op to a and b. b is ignored for unary operations (sqrt)
// and must be non-nil for binary ones.
//
// Semantics:
//   - percentage: a percent of b, i.e. a × b ÷ 100
//   - remainder:  a mod b with the sign of a (like Go's % / math.Mod)
func Calculate(op string, a float64, b *float64) (float64, error) {
	isBinary, ok := binary[op]
	if !ok {
		return 0, ErrUnknownOperation
	}
	if isBinary && b == nil {
		return 0, ErrMissingOperand
	}

	var result float64
	switch op {
	case Add:
		result = a + *b
	case Subtract:
		result = a - *b
	case Multiply:
		result = a * *b
	case Divide:
		if *b == 0 {
			return 0, ErrDivisionByZero
		}
		result = a / *b
	case Power:
		result = math.Pow(a, *b)
	case Sqrt:
		if a < 0 {
			return 0, ErrNegativeSqrt
		}
		result = math.Sqrt(a)
	case Percent:
		result = a * *b / 100
	case Remainder:
		if *b == 0 {
			return 0, ErrDivisionByZero
		}
		result = math.Mod(a, *b)
	}

	// Covers overflow (1e308 * 10) and undefined results like (-8)^0.5.
	if math.IsNaN(result) || math.IsInf(result, 0) {
		return 0, ErrNotFinite
	}
	return result, nil
}
