package main

import (
	"callback_server/proxy"
	"callback_server/service/rasa"
	"callback_server/socket"
	"github.com/elastic/go-elasticsearch"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os"
	"time"
)

const (
	SERVER_PORT_NUMBER     = "5034"
	ELASTIC_SEARCH_ADDRESS = "http://localhost:9200"
)

func main() {

	log.SetOutput(os.Stdout)
	log.SetLevel(log.InfoLevel)
	log.SetFormatter(&log.TextFormatter{})

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},           // All origins
		AllowedMethods: []string{"GET", "POST"}, // Allowing only get, just an example
	})

	elasticClient, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{
			ELASTIC_SEARCH_ADDRESS,
		},
	})
	if err != nil {
		log.Fatal(err)
	}
	client := http.Client{
		Transport: &http.Transport{ResponseHeaderTimeout: 2 * time.Minute},
		Timeout:   2 * time.Minute,
	}
	socketServer := socket.SocketServer{Client: &client, Sockets: make(map[string]*socket.Socket)}
	proxyServer := proxy.Proxy{Client: &client, ElasticClient: elasticClient, SocketServer: &socketServer}
	actionServer := rasa.NewActionServer(&client, &proxyServer)
	router := mux.NewRouter()
	router.HandleFunc("/bot", proxyServer.ReceiveRasaCallback)
	router.HandleFunc("/upload", proxyServer.HandleFileUpload).Methods(http.MethodPost)
	router.HandleFunc("/query", proxyServer.HandleQuery).Methods(http.MethodPost)
	router.HandleFunc("/documents", proxyServer.HandleFetchDocuments).Methods(http.MethodGet)
	router.HandleFunc("/document/youtube-time-data", proxyServer.HandleFetchTimeForYoutubeDocument).Methods(http.MethodPost)
	router.HandleFunc("/ws", socketServer.WebsocketHandler)
	router.HandleFunc("/rasa-action-server/webhook", actionServer.HandleActionServer)
	log.Info("Listening on port: ", SERVER_PORT_NUMBER)
	s := &http.Server{
		Addr:         "127.0.0.1:" + SERVER_PORT_NUMBER,
		Handler:      c.Handler(router),
		ReadTimeout:  2 * time.Minute,
		WriteTimeout: 2 * time.Minute,
	}
	err = s.ListenAndServe()
	if err != nil {
		log.Fatal(err)
	}
}
