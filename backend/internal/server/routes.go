package server

import (
	"net/http"

	"fmt"
	"log"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"nhooyr.io/websocket"
)

func (s *Server) RegisterRoutes() http.Handler {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*", "http://localhost:3000"},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
	}))

	e.GET("/", s.HelloWorldHandler)

	e.GET("/websocket", s.websocketHandler)

	return e
}

func (s *Server) HelloWorldHandler(c echo.Context) error {
	resp := map[string]string{
		"message": "Hello World",
	}

	return c.JSON(http.StatusOK, resp)
}

func (s *Server) websocketHandler(c echo.Context) error {
	w := c.Response().Writer
	r := c.Request()
	socket, err := websocket.Accept(
		w, r,
		&websocket.AcceptOptions{
			OriginPatterns: []string{
				"localhost:3000",
			},
		},
	)

	if err != nil {
		log.Printf("could not open websocket: %v", err)
		_, _ = w.Write([]byte("could not open websocket"))
		w.WriteHeader(http.StatusInternalServerError)
		return nil
	}

	defer func() {
		socket.Close(websocket.StatusGoingAway, "server closing websocket")
	}()

	ctx := r.Context()

	err = socket.Write(ctx, websocket.MessageText, []byte("createoffer"))
	if err != nil {
		return nil
	}

	for {
		mt, message, err := socket.Read(ctx)
		if err != nil {
			break
		}

		if mt == websocket.MessageText {
			if "{\"type\":\"offer\"" == string(message[:15]) {
				err = socket.Write(ctx, websocket.MessageText, []byte("offer received"))
			}

			if err != nil {
				break
			}
		}

		fmt.Println(string(message))
		time.Sleep(time.Millisecond * 2)
	}
	return nil
}
