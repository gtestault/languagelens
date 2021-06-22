package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type RasaProxy struct {
	client http.Client
}

type RasaCallbackMessage struct {
	Text string `json:"text"`
}

func (r *RasaProxy) ReceiveRasaCallback(w http.ResponseWriter, req *http.Request) {
	var msg RasaCallbackMessage
	_ = json.NewDecoder(req.Body).Decode(&msg)
	log.Print(msg.Text)
	return
}

type ChatMessage struct {
	Message string `json:"message"`
	Sender  string `json:"sender"`
}

func (r *RasaProxy) SendChatMessage(w http.ResponseWriter, req *http.Request) {
	res, err := r.client.Post("http://localhost:5005/webhooks/callback/webhook", "text/json", req.Body)
	if err != nil {
		log.Default().Printf("failed to proxy message to rasa")
		w.WriteHeader(http.StatusBadGateway)
		return
	}
	if res.StatusCode > 200 {
		log.Default().Printf("failed to proxy message to rasa")
		w.WriteHeader(http.StatusBadGateway)
		return
	}
}

func main() {
	proxy := RasaProxy{client: http.Client{Timeout: 10 * time.Second}}
	http.HandleFunc("/bot", proxy.ReceiveRasaCallback)
	http.HandleFunc("/user_message", proxy.SendChatMessage)
	_ = http.ListenAndServe("127.0.0.1:5034", nil)
}
