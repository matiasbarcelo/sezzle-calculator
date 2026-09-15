// Package api exposes the calculator over HTTP as a JSON REST API.
package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/matiasbarcelo/sezzle-calc/backend/internal/calculator"
)

const maxBodyBytes = 1 << 16

// CalculateRequest is the body for POST /api/v1/{operation}.
// Pointers distinguish a missing operand from an explicit 0.
type CalculateRequest struct {
	A *float64 `json:"a"`
	B *float64 `json:"b,omitempty"`
}

// CalculateResponse is returned on success.
type CalculateResponse struct {
	Operation string   `json:"operation"`
	A         float64  `json:"a"`
	B         *float64 `json:"b,omitempty"`
	Result    float64  `json:"result"`
}

// ErrorResponse is returned for every failure.
type ErrorResponse struct {
	Error string `json:"error"`
}

// NewHandler builds the router. allowedOrigin sets the CORS
// Access-Control-Allow-Origin header ("" disables CORS headers).
func NewHandler(allowedOrigin string) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/health", handleHealth)
	mux.HandleFunc("GET /api/v1/operations", handleOperations)
	mux.HandleFunc("POST /api/v1/{operation}", handleCalculate)
	return withCORS(allowedOrigin, mux)
}

func handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func handleOperations(w http.ResponseWriter, _ *http.Request) {
	type op struct {
		Name     string   `json:"name"`
		Operands []string `json:"operands"`
	}
	ops := make([]op, 0, len(calculator.Operations()))
	for _, name := range calculator.Operations() {
		operands := []string{"a"}
		if isBinary, _ := calculator.IsBinary(name); isBinary {
			operands = append(operands, "b")
		}
		ops = append(ops, op{Name: name, Operands: operands})
	}
	writeJSON(w, http.StatusOK, map[string]any{"operations": ops})
}

func handleCalculate(w http.ResponseWriter, r *http.Request) {
	operation := r.PathValue("operation")
	isBinary, ok := calculator.IsBinary(operation)
	if !ok {
		writeError(w, http.StatusNotFound, fmt.Sprintf("unknown operation %q", operation))
		return
	}

	var req CalculateRequest
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body: "+decodeErrorMessage(err))
		return
	}
	if dec.More() {
		writeError(w, http.StatusBadRequest, "invalid JSON body: unexpected data after object")
		return
	}
	if req.A == nil {
		writeError(w, http.StatusBadRequest, `missing operand "a"`)
		return
	}
	if isBinary && req.B == nil {
		writeError(w, http.StatusBadRequest, `missing operand "b"`)
		return
	}
	if !isBinary {
		req.B = nil // sqrt ignores b; don't echo it back
	}

	result, err := calculator.Calculate(operation, *req.A, req.B)
	if err != nil {
		writeError(w, statusFor(err), err.Error())
		return
	}

	writeJSON(w, http.StatusOK, CalculateResponse{
		Operation: operation,
		A:         *req.A,
		B:         req.B,
		Result:    result,
	})
}

// statusFor maps calculator errors to HTTP status codes. Math errors are valid
// requests that can't be computed, so they get 422 rather than 400.
func statusFor(err error) int {
	switch {
	case errors.Is(err, calculator.ErrUnknownOperation):
		return http.StatusNotFound
	case errors.Is(err, calculator.ErrMissingOperand):
		return http.StatusBadRequest
	default:
		return http.StatusUnprocessableEntity
	}
}

func decodeErrorMessage(err error) string {
	var maxErr *http.MaxBytesError
	switch {
	case errors.Is(err, io.EOF):
		return "body is empty"
	case errors.As(err, &maxErr):
		return "body too large"
	default:
		return err.Error()
	}
}

func withCORS(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if allowedOrigin != "" {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		log.Printf("write response: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, ErrorResponse{Error: message})
}
