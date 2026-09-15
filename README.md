# Full-Stack Calculator

A calculator with a **React** frontend and a **Go** REST API backend. The UI is modeled on a Casio SL-200TE pocket calculator; every calculation is performed by the backend and returned as JSON.

**Operations:** addition, subtraction, multiplication, division, exponentiation, square root, percentage, remainder.

```
.
├── backend/              Go REST API (standard library only)
│   ├── cmd/server/         entry point: config, graceful shutdown
│   ├── internal/calculator/ arithmetic + error rules (no HTTP)
│   ├── internal/api/       routing, JSON validation, status codes, CORS
│   └── Dockerfile
├── frontend/             React (Vite) app
│   └── src/
│       ├── components/     Calculator, Display, Keypad, SevenSegmentDigit
│       ├── calculatorLogic.js  key-press state machine
│       ├── api.js          API client
│       ├── entry.js / format.js  typing rules, 8-digit display formatting
│       └── useCalculator.js     React hook wiring state + API
├── Dockerfile            builds the frontend and serves it with nginx
├── nginx.conf            serves the app, proxies /api/ to the backend
└── docker-compose.yml    runs frontend + backend together
```

---

## Setup instructions

### Prerequisites

| To run with | You need |
|---|---|
| Docker (recommended) | [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine with Compose v2 |
| Without Docker | [Go 1.23+](https://go.dev/dl/) and [Node.js 22+](https://nodejs.org/) |

Clone the repository and run all commands from its root.

### Run with Docker (frontend + backend together)

```bash
docker compose up --build -d
```

Open **http://localhost:8080**.

- `frontend` — nginx serving the built React app on port 8080, forwarding `/api/*` to the backend
- `backend` — the Go API, reachable only inside the Compose network

Stop it:

```bash
docker compose down
```

After changing code, run `docker compose up --build -d` again to rebuild.

---

## How to run the frontend and backend

### Backend (Go)

```bash
cd backend
go run ./cmd/server
```

Listens on `http://localhost:8080` by default.

| Environment variable | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | Port to listen on |
| `ALLOWED_ORIGIN` | `*` | CORS `Access-Control-Allow-Origin` value |

To run the backend alone in Docker:

```bash
docker build -t calculator-api ./backend
docker run --rm -p 8081:8080 calculator-api
```

### Frontend (React)

The dev server proxies `/api` to `http://localhost:8081`, so start the backend on port **8081**:

```bash
cd backend
PORT=8081 go run ./cmd/server
```

(PowerShell: `$env:PORT="8081"; go run ./cmd/server`)

Then, in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. To point the proxy elsewhere, set `API_PROXY_TARGET` (e.g. `API_PROXY_TARGET=http://localhost:9000 npm run dev`).

Production build: `npm run build` (output in `frontend/dist`).

### Tests and coverage

**Backend** — unit tests for the arithmetic and HTTP handler tests for every endpoint and error case:

```bash
cd backend
go test ./... -cover
```

HTML coverage report:

```bash
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

**Frontend** — unit tests for the key-press logic (against a fake API), display formatting, and the API client:

```bash
cd frontend
npm test
npm run coverage
```

`npm run coverage` prints a table and writes an HTML report to `frontend/coverage/index.html`.

Current coverage:

| Layer | Package / file | Statements |
|---|---|---|
| Backend | `internal/api` | 93.8% |
| Backend | `internal/calculator` | 88.9% |
| Frontend | `api.js`, `format.js`, `entry.js` | 100% |
| Frontend | `calculatorLogic.js` | 98.6% |
| Frontend | all logic files | 90.6% |

---

## API

Base path: `/api/v1`. All requests and responses are JSON.

| Method | Endpoint | Body | Result |
|---|---|---|---|
| `POST` | `/add` | `{"a": 2, "b": 3}` | a + b |
| `POST` | `/subtract` | `{"a": 2, "b": 3}` | a − b |
| `POST` | `/multiply` | `{"a": 2, "b": 3}` | a × b |
| `POST` | `/divide` | `{"a": 2, "b": 3}` | a ÷ b |
| `POST` | `/power` | `{"a": 2, "b": 3}` | a<sup>b</sup> |
| `POST` | `/sqrt` | `{"a": 16}` | √a (`b` is ignored) |
| `POST` | `/percentage` | `{"a": 200, "b": 5}` | b percent of a = a × b ÷ 100 |
| `POST` | `/remainder` | `{"a": 17, "b": 5}` | a mod b (sign follows a) |
| `GET` | `/operations` | — | Lists operations and their operands |
| `GET` | `/health` | — | `{"status": "ok"}` |

### Response format

Success — `200 OK`:

```json
{ "operation": "divide", "a": 10, "b": 4, "result": 2.5 }
```

Error — always `{"error": "<message>"}`:

| Status | When |
|---|---|
| `400 Bad Request` | Empty or malformed JSON, unknown fields, non-numeric operands, missing `a` or `b` |
| `404 Not Found` | Unknown operation |
| `405 Method Not Allowed` | Wrong HTTP method |
| `422 Unprocessable Entity` | Valid input that can't be computed: division or remainder by zero, square root of a negative number, result that is not finite (e.g. `10^400`) |

### Examples of API calls

With `docker compose up` running, the API is available through the frontend at `http://localhost:8080/api/v1`. (If you run the backend directly, use its port instead.)

**Addition**

```bash
curl -X POST http://localhost:8080/api/v1/add \
  -H "Content-Type: application/json" \
  -d '{"a": 12, "b": 30}'
```

```json
{"operation":"add","a":12,"b":30,"result":42}
```

**Division**

```bash
curl -X POST http://localhost:8080/api/v1/divide \
  -H "Content-Type: application/json" \
  -d '{"a": 1, "b": 3}'
```

```json
{"operation":"divide","a":1,"b":3,"result":0.3333333333333333}
```

**Square root** (single operand)

```bash
curl -X POST http://localhost:8080/api/v1/sqrt \
  -H "Content-Type: application/json" \
  -d '{"a": 81}'
```

```json
{"operation":"sqrt","a":81,"result":9}
```

**Percentage** — 5% of 100

```bash
curl -X POST http://localhost:8080/api/v1/percentage \
  -H "Content-Type: application/json" \
  -d '{"a": 100, "b": 5}'
```

```json
{"operation":"percentage","a":100,"b":5,"result":5}
```

**Division by zero** → `422`

```bash
curl -X POST http://localhost:8080/api/v1/divide \
  -H "Content-Type: application/json" \
  -d '{"a": 1, "b": 0}'
```

```json
{"error":"division by zero"}
```

**Square root of a negative number** → `422`

```bash
curl -X POST http://localhost:8080/api/v1/sqrt \
  -H "Content-Type: application/json" \
  -d '{"a": -9}'
```

```json
{"error":"square root of a negative number"}
```

**Invalid input** → `400`

```bash
curl -X POST http://localhost:8080/api/v1/add \
  -H "Content-Type: application/json" \
  -d '{"a": "two", "b": 3}'
```

```json
{"error":"invalid JSON body: json: cannot unmarshal string into Go struct field CalculateRequest.a of type float64"}
```

**Missing operand** → `400`

```bash
curl -X POST http://localhost:8080/api/v1/multiply \
  -H "Content-Type: application/json" \
  -d '{"a": 4}'
```

```json
{"error":"missing operand \"b\""}
```

---

## Calculator behavior

### Keypad

| Key | Behavior |
|---|---|
| `0`–`9` | Appends a digit on the right. A lone leading `0` is replaced. Max 8 digits. |
| `•` | Decimal point (only one per number). |
| `+` `−` `×` `÷` | Saves the number on screen and waits for the second number. The matching box on the display lights up. |
| `^` | Exponent: `2 ^ 10 =` → `1024`. The `^` indicator lights while waiting. |
| `R` | Remainder: `17 R 5 =` → `2`. |
| `%` | Percentage: `100 % 5 =` → `5` (5% of 100). The `%` indicator lights while waiting. |
| `√` | Pressed **before** the number: `√ 81 =` → `9`. The `√` indicator lights while typing. |
| `=` | Sends the pending operation to the API and shows the result. |
| `C` | Clears the number being typed (keeps the pending operation). Clears an error. |
| `AC` | Resets everything. |

### Details

- **Typing never calls the API.** Digits are handled in the browser; one `POST` is sent when a calculation is completed.
- **The first number stays on screen** after pressing an operation; the display switches when you type the next number.
- **Chaining** evaluates left to right like a pocket calculator: `2 + 3 × 4 =` → `(2 + 3) × 4 = 20`.
- **Changing the operation:** pressing two operation keys in a row keeps the last one (`9 + − 4 =` → `5`).
- **Results are the next starting point:** `2 + 2 = × 3 =` → `12`. Typing a digit after `=` starts a new number.
- **√ with a pending operation** applies to the second number: `9 + √ 16 =` → `13`. It is completed when `=` or another operation key is pressed (`√ 9 × 2 =` → `6`).
- **Negative input:** `−` pressed right after `√` (before any digits) makes the number negative, e.g. `√ − 9 =`.
- **8-digit display:** results are rounded to fit (`1 ÷ 3` → `0.3333333`); a minus sign uses one digit. Full precision from the API is kept for the next calculation.
- **Errors** show `E` with `0` on the display: any API error (division/remainder by zero, square root of a negative, invalid result), a result too large for 8 digits, or the API being unreachable. All keys except `C` and `AC` are ignored until cleared.
- **One request at a time:** key presses made while a request is in flight are ignored.

---

## Design decisions and assumptions

The design is based on an old accounting calculator of my father's from the 2000s, a Casio SL-200TE "Tax & Exchange" model. I chose it because it's symbolic for me: it represents my connection to Argentina and my coming to the United States. It also mirrors this role, a remote position paid in USD that draws on accounting experience from Argentina. On a practical level, it gave me a concrete starting point for the interface: the dual-leaf case, the seven-segment display, and the keypad layout, which I then adapted to the operations this assessment requires.
