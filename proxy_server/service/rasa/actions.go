package rasa

import (
	"callback_server/proxy"
	"encoding/json"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"net/http"
)

type ActionServer struct {
	Client *http.Client
	Proxy  *proxy.Proxy
}

func NewActionServer(client *http.Client, proxy *proxy.Proxy) *ActionServer {
	return &ActionServer{
		Client: client,
		Proxy:  proxy,
	}
}

func (obj *ActionServerReturnedObject) writeAsJSON(w http.ResponseWriter) error {
	return json.NewEncoder(w).Encode(obj)
}
func (as *ActionServer) HandleActionServer(w http.ResponseWriter, req *http.Request) {
	input := ActionServerInput{}
	err := json.NewDecoder(req.Body).Decode(&input)
	if err != nil {
		log.Error(errors.Wrap(err, "action_server"))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	switch input.NextAction {
	case ACTION_PROCESS_YOUTUBE:
		as.HandleYoutubeAction(w, &input)
		return
	default:
		w.WriteHeader(http.StatusBadRequest)
		err = json.NewEncoder(w).Encode(&ActionRejectedError{ActionName: input.NextAction, Error: "unknown action"})
		if err != nil {
			log.Error(errors.Wrap(err, "action_server"))
		}
		return
	}
}
