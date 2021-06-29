package main

import (
	"callback_server/proxy"
	"callback_server/socket"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os"
	"time"
)

const (
	SERVER_PORT_NUMBER = "5034"
)

func main() {

	log.SetOutput(os.Stdout)
	log.SetLevel(log.InfoLevel)
	log.SetFormatter(&log.TextFormatter{})

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},           // All origins
		AllowedMethods: []string{"GET", "POST"}, // Allowing only get, just an example
	})

	client := http.Client{Timeout: 20 * time.Second}
	socketServer := socket.SocketServer{Client: &client, Sockets: make(map[string]*socket.Socket)}
	proxyServer := proxy.Proxy{Client: &client, SocketServer: &socketServer}
	router := mux.NewRouter()
	router.HandleFunc("/bot", proxyServer.ReceiveRasaCallback)
	router.HandleFunc("/upload", proxyServer.HandleFileUpload).Methods(http.MethodPost)
	router.HandleFunc("/query", proxyServer.HandleQuery).Methods(http.MethodPost)
	router.HandleFunc("/ws", socketServer.WebsocketHandler)
	log.Info("Listening on port: ", SERVER_PORT_NUMBER)
	err := http.ListenAndServe("127.0.0.1:"+SERVER_PORT_NUMBER, c.Handler(router))
	if err != nil {
		log.Fatal(err)
	}
}
