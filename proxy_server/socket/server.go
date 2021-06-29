package socket

import (
	"bytes"
	"encoding/json"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"net/http"
)

const (
	SENDER_BOT  = 0
	SENDER_USER = 1
)

type SocketServer struct {
	Sockets map[string]*Socket
	Client  *http.Client
}

type Socket struct {
	Write chan string
	Read  chan string
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,

	CheckOrigin: func(r *http.Request) bool { return true }, //TODO: change for deployment
}

func (ss *SocketServer) WebsocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Warn(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	log.Warn("connected to socket")
	id, err := uuid.NewUUID()
	if err != nil {
		log.Warn(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	readChan := make(chan string)
	writeChan := make(chan string)
	socket := Socket{Read: readChan, Write: writeChan}
	go ss.SocketReader(conn, readChan, id.String())
	go ss.SocketWriter(conn, writeChan)
	ss.Sockets[id.String()] = &socket
}

func (ss *SocketServer) SocketReader(conn *websocket.Conn, read chan string, id string) {
	for {
		msgType, rawMsg, err := conn.ReadMessage()
		if err != nil {
			log.Warn("socket closed", err)
			close(read)
			return
		}
		if msgType != websocket.TextMessage {
			log.Warn("ignoring message: ", msgType)
		}
		var msg ChatMessage
		err = json.Unmarshal(rawMsg, &msg)
		if err != nil {
			log.Warn(err)
			continue
		}
		msg.Sender = id
		err = ss.SendChatMessage(msg)
		if err != nil {
			log.Warn("failed to proxy message to rasa: ", err)
		}
	}
}
func (ss *SocketServer) SocketWriter(conn *websocket.Conn, write chan string) {
	for {
		msg := <-write
		err := conn.WriteMessage(websocket.TextMessage, []byte(msg))
		if err != nil {
			log.Warn("socket closed", err)
			close(write)
			return
		}
	}
}

type ChatMessage struct {
	Message string `json:"message"`
	Sender  string `json:"sender"`
}

type ChatMessageReply struct {
	Message string           `json:"message"`
	Sender  int              `json:"sender"`
	Custom  *json.RawMessage `json:"custom"`
}

func (ss *SocketServer) SendChatMessage(msg ChatMessage) error {
	rawMsg, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	log.Warn("proxying message: ", string(rawMsg))
	res, err := ss.Client.Post("http://localhost:5005/webhooks/callback/webhook", "text/json", bytes.NewBuffer(rawMsg))
	if err != nil {
		return err
	}
	if res.StatusCode > 200 {
		return errors.Errorf("wrong status code from rasa: %v", res.StatusCode)
	}
	return nil
}
