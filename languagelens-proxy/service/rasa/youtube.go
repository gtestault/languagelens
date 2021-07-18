package rasa

import (
	"bytes"
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
	transcript, err := as.Proxy.FetchYoutubeTranscriptDocument(videoId)
	if err != nil {
		as.youtubeErrorAction(w, err)
		return
	}
	file := bytes.NewBuffer([]byte(transcript.Text))
	err = as.Proxy.ProxyFileToHaystack(file, videoId+".txt", "", transcript.Meta)
	if err != nil {
		as.youtubeErrorAction(w, err)
		return
	}
	err = as.NewYoutubeResponse(videoId).writeAsJSON(w)
	if err != nil {
		log.Error(errors.Wrap(err, "youtube action"))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
