package proxy

import (
	"github.com/elastic/go-elasticsearch"
	"languagelens-proxy/socket"
	"net/http"
)

type Proxy struct {
	SocketServer             *socket.SocketServer
	Client                   *http.Client
	ElasticClient            *elasticsearch.Client
	YoutubeTranscriptAddress string
	HaystackAddress          string
}
