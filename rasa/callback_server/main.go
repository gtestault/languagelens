package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
	"io"
	"io/ioutil"
	"log"
	"mime/multipart"
	"net/http"
	"time"
)

const (
	SENDER_BOT  = 0
	SENDER_USER = 1

	HAYSTACK_API_BASE_URL    = "http://127.0.0.1:8000"
	HAYSTACK_API_UPLOAD_PATH = "/file-upload"

	SERVER_PORT_NUMBER = "5034"
)

type RasaProxy struct {
	ss     *SocketServer
	client *http.Client
}

type RasaCallbackMessage struct {
	Text      string           `json:"text"`
	Recipient string           `json:"recipient_id"`
	Custom    *json.RawMessage `json:"custom"`
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
	rawMsg, err := json.Marshal(ChatMessageReply{Message: msg.Text, Sender: SENDER_BOT, Custom: msg.Custom})
	if err != nil {
		log.Println(err)
		return
	}
	socket.Write <- string(rawMsg)
	return
}

func logInternalServerError(w http.ResponseWriter, err error) {
	log.Println(err)
	w.WriteHeader(http.StatusInternalServerError)
}

func (r *RasaProxy) HandleFileUpload(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "multipart/form-data")
	err := req.ParseMultipartForm(32 << 20) // 32MB is the default used by FormFile
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	fhs := req.MultipartForm.File["files"]
	for _, fh := range fhs {
		f, err := fh.Open()
		if err != nil {
			logInternalServerError(w, err)
			return
		}
		proxyReqBody := &bytes.Buffer{}
		formWriter := multipart.NewWriter(proxyReqBody)
		fw, err := formWriter.CreateFormFile("file", fh.Filename)
		if err != nil {
			logInternalServerError(w, err)
			return
		}
		_, err = io.Copy(fw, f)
		if err != nil {
			logInternalServerError(w, err)
			return
		}
		_ = formWriter.Close()
		proxyReq, err := http.NewRequest(http.MethodPost, HAYSTACK_API_BASE_URL+HAYSTACK_API_UPLOAD_PATH, bytes.NewReader(proxyReqBody.Bytes()))
		if err != nil {
			logInternalServerError(w, err)
			return
		}
		proxyReq.Header.Set("Content-Type", formWriter.FormDataContentType())
		proxyResp, err := r.client.Do(proxyReq)
		if err != nil {
			logInternalServerError(w, err)
			return
		}
		if proxyResp.StatusCode > 200 {
			proxyErrResp, _ := ioutil.ReadAll(proxyResp.Body)
			err = errors.New(fmt.Sprintf("haystack wrong status code: %v, messsage: %v", proxyResp.Status, string(proxyErrResp)))
			logInternalServerError(w, err)
		}
		log.Println("successful file proxy")
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
	client  *http.Client
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
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},           // All origins
		AllowedMethods: []string{"GET", "POST"}, // Allowing only get, just an example
	})

	client := http.Client{Timeout: 10 * time.Second}
	socketServer := SocketServer{client: &client, Sockets: make(map[string]*Socket)}
	proxy := RasaProxy{client: &client, ss: &socketServer}
	router := mux.NewRouter()
	router.HandleFunc("/bot", proxy.ReceiveRasaCallback)
	router.HandleFunc("/upload", proxy.HandleFileUpload).Methods(http.MethodPost)
	router.HandleFunc("/ws", socketServer.websocketHandler)
	log.Println("Listening on port: ", SERVER_PORT_NUMBER)
	err := http.ListenAndServe("127.0.0.1:"+SERVER_PORT_NUMBER, c.Handler(router))
	if err != nil {
		log.Fatal(err)
	}
}
