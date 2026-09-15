# ---- Build: static Go binary ----
FROM golang:1.23-alpine AS build
WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /server ./cmd/server

# ---- Run: minimal image, non-root ----
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /server /server

ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/server"]
