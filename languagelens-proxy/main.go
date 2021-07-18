package main

import (
	"github.com/Netflix/go-env"
	"github.com/elastic/go-elasticsearch"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	log "github.com/sirupsen/logrus"
	"languagelens-proxy/proxy"
	"languagelens-proxy/service/rasa"
	"languagelens-proxy/socket"
	"net/http"
	"os"
	"time"
)

const (
	SERVER_PORT_NUMBER             = "5034"
	DEFAULT_ELASTIC_SEARCH_ADDRESS = "http://localhost:9200"
)

func defaultString(value string, defaultStr string) string {
	if value == "" {
		return defaultStr
	}
	return value
}

type Environment struct {
	ElasticSearch struct {
		Address string `env:"ELASTIC_SEARCH_ADDRESS"`
	}
	Rasa struct {
		Address string `env:"RASA_ADDRESS"`
	}
	YoutubeTranscriptServer struct {
		Address string `env:"YOUTUBE_TRANSCRIPT_SERVER_ADDRESS"`
	}
	Haystack struct {
		Address string `env:"HAYSTACK_ADDRESS"`
	}
}

func main() {
	var environment Environment
	_, err := env.UnmarshalFromEnviron(&environment)
	if err != nil {
		log.Fatal(err)
	}
	log.SetOutput(os.Stdout)
	log.SetLevel(log.InfoLevel)
	log.SetFormatter(&log.TextFormatter{})

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},           // All origins
		AllowedMethods: []string{"GET", "POST"}, // Allowing only get, just an example
	})

	elasticClient, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{
			defaultString(environment.ElasticSearch.Address, DEFAULT_ELASTIC_SEARCH_ADDRESS),
		},
	})
	if err != nil {
		log.Fatal(err)
	}
	client := http.Client{
		Transport: &http.Transport{ResponseHeaderTimeout: 2 * time.Minute},
		Timeout:   2 * time.Minute,
	}
	socketServer := socket.SocketServer{
		Client:      &client,
		Sockets:     make(map[string]*socket.Socket),
		RasaAddress: defaultString(environment.Rasa.Address, "http://localhost:5005"),
	}
	proxyServer := proxy.Proxy{
		Client:                   &client,
		ElasticClient:            elasticClient,
		SocketServer:             &socketServer,
		YoutubeTranscriptAddress: defaultString(environment.YoutubeTranscriptServer.Address, "http://localhost:5035"),
		HaystackAddress:          defaultString(environment.Haystack.Address, "http://localhost:8000"),
	}
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
		Addr:         "0.0.0.0:" + SERVER_PORT_NUMBER,
		Handler:      c.Handler(router),
		ReadTimeout:  2 * time.Minute,
		WriteTimeout: 2 * time.Minute,
	}
	err = s.ListenAndServe()
	if err != nil {
		log.Fatal(err)
	}
}
