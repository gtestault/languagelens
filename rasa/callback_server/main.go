package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"time"
)

const (
	SENDER_BOT  = 0
	SENDER_USER = 1
)

type RasaProxy struct {
	ss *SocketServer
}

type RasaCallbackMessage struct {
	Text      string `json:"text"`
	Recipient string `json:"recipient_id"`
}

func (r *RasaProxy) ReceiveRasaCallback(w http.ResponseWriter, req *http.Request) {
	var msg RasaCallbackMessage
	err := json.NewDecoder(req.Body).Decode(&msg)
	if err != nil {
		log.Println(err)
		return
	}
	socket, ok := r.ss.Sockets[msg.Recipient]
	if !ok {
		log.Println("socket not found:", msg.Recipient)
		return
	}
	rawMsg, err := json.Marshal(ChatMessageReply{Message: msg.Text, Sender: SENDER_BOT})
	if err != nil {
		log.Println(err)
		return
	}
	socket.Write <- string(rawMsg)
	return
}

type ChatMessage struct {
	Message string `json:"message"`
	Sender  string `json:"sender"`
}

type ChatMessageReply struct {
	Message string `json:"message"`
	Sender  int    `json:"sender"`
}

func (ss *SocketServer) SendChatMessage(msg ChatMessage) error {
	rawMsg, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	log.Println("proxying message: ", string(rawMsg))
	res, err := ss.client.Post("http://localhost:5005/webhooks/callback/webhook", "text/json", bytes.NewBuffer(rawMsg))
	if err != nil {
		return err
	}
	if res.StatusCode > 200 {
		return errors.New(fmt.Sprintf("wrong status code from rasa: %v", res.StatusCode))
	}
	return nil
}

type SocketServer struct {
	Sockets map[string]*Socket
	client  http.Client
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

func (ss *SocketServer) websocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	log.Println("connected to socket")
	id, err := uuid.NewUUID()
	if err != nil {
		log.Println(err)
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
			log.Println("socket closed", err)
			close(read)
			return
		}
		if msgType != websocket.TextMessage {
			log.Println("ignoring message: ", msgType)
		}
		var msg ChatMessage
		err = json.Unmarshal(rawMsg, &msg)
		if err != nil {
			log.Println(err)
			continue
		}
		msg.Sender = id
		err = ss.SendChatMessage(msg)
		if err != nil {
			log.Println("failed to proxy message to rasa: ", err)
		}
	}
}
func (ss *SocketServer) SocketWriter(conn *websocket.Conn, write chan string) {
	for {
		msg := <-write
		err := conn.WriteMessage(websocket.TextMessage, []byte(msg))
		if err != nil {
			log.Println("socket closed", err)
			close(write)
			return
		}
	}
}

func main() {
	socketServer := SocketServer{client: http.Client{Timeout: 10 * time.Second}, Sockets: make(map[string]*Socket)}
	proxy := RasaProxy{ss: &socketServer}
	http.HandleFunc("/bot", proxy.ReceiveRasaCallback)
	http.HandleFunc("/ws", socketServer.websocketHandler)
	_ = http.ListenAndServe("127.0.0.1:5034", nil)
}
