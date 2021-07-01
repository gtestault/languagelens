package proxy

import (
	"callback_server/socket"
	"github.com/elastic/go-elasticsearch"
	"net/http"
)

type Proxy struct {
	SocketServer  *socket.SocketServer
	Client        *http.Client
	ElasticClient *elasticsearch.Client
}
