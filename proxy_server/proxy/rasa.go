package proxy

import (
	"callback_server/socket"
	"encoding/json"
	log "github.com/sirupsen/logrus"
	"net/http"
)

type RasaCallbackMessage struct {
	Text      string           `json:"text"`
	Recipient string           `json:"recipient_id"`
	Custom    *json.RawMessage `json:"custom"`
}

func (r *Proxy) ReceiveRasaCallback(w http.ResponseWriter, req *http.Request) {
	var msg RasaCallbackMessage
	err := json.NewDecoder(req.Body).Decode(&msg)
	if err != nil {
		log.Warn(err)
		return
	}
	s, ok := r.SocketServer.Sockets[msg.Recipient]
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
