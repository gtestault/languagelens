package proxy

import (
	"callback_server/socket"
	"net/http"
)

type Proxy struct {
	SocketServer *socket.SocketServer
	Client       *http.Client
}
