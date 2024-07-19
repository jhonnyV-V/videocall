package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"nhooyr.io/websocket"
)

const (
	USER       = "USER"       //USER userid
	JOIN_ROOM  = "JOIN_ROOM"  //JOIN_ROOM roomId
	LEAVE_ROOM = "LEAVE_ROOM" //LEAVE roomId
	OFFER      = "OFFER"      //OFFER <senderId | receiverId> offer
	ANSWER     = "ANSWER"     //ANSWER <senderId | receiverId> answer
)

type Socket struct {
	Conn    *websocket.Conn
	IsAdmin bool
	Id      string
	RoomId  string
}

var connections map[string]Socket
var rooms map[string][]string

func getCommand(message []byte, mt websocket.MessageType) (string, int) {
	if mt == websocket.MessageText {
		command := []byte{}
		index := 0
		for i, v := range message {
			index = i
			if v == ' ' {
				break
			}
			command = append(command, v)
		}
		return string(command), index
	}

	return "", 0
}

func getId(message []byte, mt websocket.MessageType) (string, int) {
	if mt == websocket.MessageText {
		command := []byte{}
		index := 0
		for i, v := range message {
			index = i
			if v == ' ' {
				break
			}
			command = append(command, v)
		}
		return string(command), index
	}

	return "", 0
}

func setUser(message []byte, ws *websocket.Conn) *Socket {
	id := string(message)
	socket := Socket{
		Conn: ws,
		Id:   id,
	}
	connections[id] = socket
	return &socket
}

func leaveRoom(ws *Socket) {
	ids := rooms[ws.RoomId]
	if len(ids) == 0 {
		return
	}
	filteredIds := make([]string, len(ids))
	for _, v := range ids {
		if v != ws.Id {
			filteredIds = append(filteredIds, v)
		}
	}

	rooms[ws.RoomId] = filteredIds
}

func joinRoom(message []byte, mt websocket.MessageType, ws *Socket) (websocket.MessageType, []byte, error) {
	rt := websocket.MessageText
	if ws.Id == "" {
		return rt, []byte{}, fmt.Errorf("No User Id")
	}

	roomId, _ := getId(message, mt)

	attendants := rooms[roomId]

	if len(attendants) == 0 {
		ws.IsAdmin = true
		ws.RoomId = roomId
		connections[ws.Id] = *ws
	}

	var response []byte

	if ws.IsAdmin {
		response = []byte("Admin")
	} else {
		response = []byte("Joined" + strings.Join(attendants, ","))
	}

	attendants = append(attendants, ws.Id)
	rooms[roomId] = attendants
	return rt, response, nil
}

func sendOffer(message []byte, mt websocket.MessageType, ws *Socket, ctx context.Context) error {
	rt := websocket.MessageText
	var response strings.Builder

	receiverId, offset := getId(message, mt)

	response.WriteString(OFFER)
	response.WriteString(" ")
	response.WriteString(ws.Id)
	response.WriteString(string(message[offset:]))

	receiver := connections[receiverId]
	if receiver == (Socket{}) {
		return fmt.Errorf("Send Offer: No connection with id %s", receiverId)
	}

	return receiver.Conn.Write(ctx, rt, []byte(response.String()))
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

	if connections == nil {
		connections = make(map[string]Socket)
		rooms = make(map[string][]string)
	}

	if err != nil {
		log.Printf("could not open websocket: %v", err)
		_, _ = w.Write([]byte("could not open websocket"))
		w.WriteHeader(http.StatusInternalServerError)
		return nil
	}

	var wrapSocket *Socket

	defer func() {
		socket.Close(websocket.StatusGoingAway, "server closing websocket")
		connections[wrapSocket.Id] = Socket{}
		if wrapSocket.RoomId != "" {
			leaveRoom(wrapSocket)
		}
	}()

	ctx := r.Context()

	for {
		mt, message, err := socket.Read(ctx)
		if err != nil {
			break
		}
		var rt websocket.MessageType
		var response []byte

		command, offset := getCommand(message, mt)

		switch command {
		case USER:
			wrapSocket = setUser(message[offset:], socket)
			rt = websocket.MessageText
			response = []byte(USER)

		case JOIN_ROOM:
			rt, response, err = joinRoom(
				message[offset:],
				mt,
				wrapSocket,
			)

		case LEAVE_ROOM:
			leaveRoom(wrapSocket)

		case OFFER:
			err = sendOffer(
				message[offset:],
				mt,
				wrapSocket,
				ctx,
			)
		}

		if err != nil {
			break
		}

		if len(response) > 0 {
			fmt.Printf("response in bytes %#v as string %s\n", response, string(response))
			err = socket.Write(ctx, rt, response)
			if err != nil {
				break
			}
		}

		fmt.Println(string(message))
		time.Sleep(time.Millisecond * 2)
	}
	return nil
}
