package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func do(t *testing.T, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	NewHandler("*").ServeHTTP(rec, req)
	return rec
}

func TestCalculateEndpoints(t *testing.T) {
	tests := []struct {
		path string
		body string
		want float64
	}{
		{"/api/v1/add", `{"a": 2, "b": 3}`, 5},
		{"/api/v1/subtract", `{"a": 2, "b": 3}`, -1},
		{"/api/v1/multiply", `{"a": 2.5, "b": 4}`, 10},
		{"/api/v1/divide", `{"a": 1, "b": 4}`, 0.25},
		{"/api/v1/power", `{"a": 2, "b": 8}`, 256},
		{"/api/v1/sqrt", `{"a": 81}`, 9},
		{"/api/v1/percentage", `{"a": 5, "b": 100}`, 5},
		{"/api/v1/remainder", `{"a": 17, "b": 5}`, 2},
		{"/api/v1/add", `{"a": 0, "b": 0}`, 0},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			rec := do(t, http.MethodPost, tt.path, tt.body)
			if rec.Code != http.StatusOK {
				t.Fatalf("status %d, body %s", rec.Code, rec.Body)
			}
			if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
				t.Errorf("content-type %q", ct)
			}
			var resp CalculateResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
				t.Fatal(err)
			}
			if resp.Result != tt.want {
				t.Errorf("result %v, want %v", resp.Result, tt.want)
			}
		})
	}
}

func TestCalculateErrors(t *testing.T) {
	tests := []struct {
		name   string
		method string
		path   string
		body   string
		status int
		errMsg string
	}{
		{"divide by zero", "POST", "/api/v1/divide", `{"a": 1, "b": 0}`, 422, "division by zero"},
		{"remainder by zero", "POST", "/api/v1/remainder", `{"a": 1, "b": 0}`, 422, "division by zero"},
		{"negative sqrt", "POST", "/api/v1/sqrt", `{"a": -1}`, 422, "square root of a negative number"},
		{"overflow", "POST", "/api/v1/power", `{"a": 10, "b": 400}`, 422, "result is not a finite number"},
		{"unknown operation", "POST", "/api/v1/modulo", `{"a": 1, "b": 2}`, 404, `unknown operation "modulo"`},
		{"missing a", "POST", "/api/v1/add", `{"b": 2}`, 400, `missing operand "a"`},
		{"missing b", "POST", "/api/v1/add", `{"a": 2}`, 400, `missing operand "b"`},
		{"empty body", "POST", "/api/v1/add", ``, 400, "invalid JSON body: body is empty"},
		{"string operand", "POST", "/api/v1/add", `{"a": "2", "b": 3}`, 400, ""},
		{"unknown field", "POST", "/api/v1/add", `{"a": 1, "b": 2, "c": 3}`, 400, ""},
		{"trailing data", "POST", "/api/v1/add", `{"a": 1, "b": 2} {}`, 400, ""},
		{"wrong method", "GET", "/api/v1/add", ``, 405, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := do(t, tt.method, tt.path, tt.body)
			if rec.Code != tt.status {
				t.Fatalf("status %d, want %d, body %s", rec.Code, tt.status, rec.Body)
			}
			if tt.errMsg == "" {
				return
			}
			var resp ErrorResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
				t.Fatal(err)
			}
			if resp.Error != tt.errMsg {
				t.Errorf("error %q, want %q", resp.Error, tt.errMsg)
			}
		})
	}
}

func TestSqrtDoesNotEchoB(t *testing.T) {
	rec := do(t, http.MethodPost, "/api/v1/sqrt", `{"a": 4, "b": 7}`)
	if strings.Contains(rec.Body.String(), `"b"`) {
		t.Errorf("sqrt response should omit b: %s", rec.Body)
	}
}

func TestHealthAndOperations(t *testing.T) {
	if rec := do(t, http.MethodGet, "/api/v1/health", ""); rec.Code != http.StatusOK {
		t.Errorf("health status %d", rec.Code)
	}

	rec := do(t, http.MethodGet, "/api/v1/operations", "")
	var resp struct {
		Operations []struct {
			Name     string   `json:"name"`
			Operands []string `json:"operands"`
		} `json:"operations"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if len(resp.Operations) != 8 {
		t.Errorf("got %d operations, want 8", len(resp.Operations))
	}
}

func TestCORSPreflight(t *testing.T) {
	rec := do(t, http.MethodOptions, "/api/v1/add", "")
	if rec.Code != http.StatusNoContent {
		t.Errorf("status %d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("allow-origin %q", got)
	}
}
