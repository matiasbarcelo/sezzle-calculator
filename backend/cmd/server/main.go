// Command server runs the calculator REST API.
//
// Environment:
//
//	PORT            port to listen on (default 8080)
//	ALLOWED_ORIGIN  CORS Access-Control-Allow-Origin value (default "*")
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/matiasbarcelo/sezzle-calc/backend/internal/api"
)

func main() {
	port := getenv("PORT", "8080")
	allowedOrigin := getenv("ALLOWED_ORIGIN", "*")

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           api.NewHandler(allowedOrigin),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("calculator API listening on :%s", port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("shutdown: %v", err)
	}
	log.Print("server stopped")
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
