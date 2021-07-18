package proxy

import (
	"encoding/json"
	log "github.com/sirupsen/logrus"
	"languagelens-proxy/socket"
	"net/http"
)

type RasaCallbackMessage struct {
	Text      string           `json:"text"`
	Recipient string           `json:"recipient_id"`
	Custom    *json.RawMessage `json:"custom"`
}

func (p *Proxy) ReceiveRasaCallback(w http.ResponseWriter, req *http.Request) {
	var msg RasaCallbackMessage
	err := json.NewDecoder(req.Body).Decode(&msg)
	if err != nil {
		log.Warn(err)
		return
	}
	s, ok := p.SocketServer.Sockets[msg.Recipient]
	if !ok {
		log.Warn("socket not found:", msg.Recipient)
		return
	}
	rawMsg, err := json.Marshal(socket.ChatMessageReply{Message: msg.Text, Sender: socket.SENDER_BOT, Custom: msg.Custom})
	if err != nil {
		log.Warn(err)
		return
	}
	s.Write <- string(rawMsg)
	return
}
