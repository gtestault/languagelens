package rasa

import (
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"net/http"
	"net/url"
)

const (
	ACTION_PROCESS_YOUTUBE = "action_process_youtube"
)

func (as *ActionServer) youtubeErrorAction(w http.ResponseWriter, err error) {
	err2 := as.NewTextResponse("Whoops, something went wrong during the processing of the youtube video").writeAsJSON(w)
	log.Error(errors.Wrap(err, "youtube action"))
	if err2 != nil {
		log.Error(errors.Wrap(err2, "youtube action responding with error"))
	}
}
func (as *ActionServer) HandleYoutubeAction(w http.ResponseWriter, input *ActionServerInput) {

	youtubeURL, err := url.Parse(input.Tracker.Slots.YoutubeLink)
	if err != nil {
		as.youtubeErrorAction(w, err)
		return
	}
	videoId := youtubeURL.Query().Get("v")
	log.Info("video id: ", videoId)
	err = as.NewTextResponse("All clear! I'm now processing that youtube video for you!").writeAsJSON(w)
	if err != nil {
		log.Error(errors.Wrap(err, "youtube action"))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
