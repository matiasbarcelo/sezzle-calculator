# Calculator API (Go)

JSON REST API for the calculator. Standard library only (Go 1.23, `net/http`).

## Layout

```
cmd/server/            entry point (env config, graceful shutdown)
internal/calculator/   pure arithmetic + errors, no HTTP
internal/api/          routing, JSON validation, error → status mapping, CORS
```

## Endpoints

| Method | Path | Body | Notes |
|---|---|---|---|
| `POST` | `/api/v1/add` | `{"a": 2, "b": 3}` | a + b |
| `POST` | `/api/v1/subtract` | `{"a": 2, "b": 3}` | a − b |
| `POST` | `/api/v1/multiply` | `{"a": 2, "b": 3}` | a × b |
| `POST` | `/api/v1/divide` | `{"a": 2, "b": 3}` | a ÷ b |
| `POST` | `/api/v1/power` | `{"a": 2, "b": 3}` | a ^ b |
| `POST` | `/api/v1/sqrt` | `{"a": 16}` | √a (`b` ignored) |
| `POST` | `/api/v1/percentage` | `{"a": 5, "b": 200}` | a percent of b = a × b ÷ 100 |
| `POST` | `/api/v1/remainder` | `{"a": 17, "b": 5}` | a mod b, sign follows a (`R` key) |
| `GET` | `/api/v1/operations` | — | lists operations and their operands |
| `GET` | `/api/v1/health` | — | `{"status":"ok"}` |

Success:

```json
{"operation": "divide", "a": 10, "b": 4, "result": 2.5}
```

Errors always return `{"error": "<message>"}`:

| Status | When |
|---|---|
| `400` | Malformed/empty JSON, unknown fields, non-numeric operands, missing `a` or `b` |
| `404` | Unknown operation |
| `405` | Wrong HTTP method |
| `422` | Valid request that can't be computed: division/remainder by zero, square root of a negative, non-finite result (overflow, e.g. `10^400`, or `(-8)^0.5`) |

## Run

```bash
go run ./cmd/server
```

| Env var | Default | |
|---|---|---|
| `PORT` | `8080` | listen port |
| `ALLOWED_ORIGIN` | `*` | CORS `Access-Control-Allow-Origin` |

## Test

```bash
go test ./...
```

## Docker

```bash
docker build -t sezzle-calc-api .
docker run --rm -p 8081:8080 sezzle-calc-api
```
