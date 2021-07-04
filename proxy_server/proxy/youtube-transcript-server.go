package proxy

import (
	"encoding/json"
	"github.com/pkg/errors"
	"strings"
	"time"
)

const (
	YOUTUBE_TRANSCRIPT_SERVER_BASE_URL = "http://localhost:5035"
)

type YoutubeTranscriptSentence struct {
	Text     string  `json:"text"`
	Start    float64 `json:"start"`
	Duration float64 `json:"duration"`
}

type YoutubeTranscript []YoutubeTranscriptSentence

type YoutubeTranscriptDocument struct {
	text string
	meta map[int]time.Time
}

func (yt YoutubeTranscript) ToDocWithMeta() {
	var docSize int
	for _, s := range yt {
		docSize += len(s.Text)
	}
	var b strings.Builder
	b.Grow(docSize)
	for _, s := range yt {
		docSize += len(s.Text)
	}
}

func (p *Proxy) FetchYoutubeTranscript(id string) (YoutubeTranscript, error) {
	transcript, err := p.fetchYoutubeTranscript(id)
	if err != nil {
		return nil, errors.Wrap(err, "proxy: youtube-transcript-server")
	}
	return transcript, nil
}

func (p *Proxy) fetchYoutubeTranscript(id string) (YoutubeTranscript, error) {
	resp, err := p.Client.Get(YOUTUBE_TRANSCRIPT_SERVER_BASE_URL + "/" + id)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode > 200 {
		return nil, errors.Errorf("bad status code: %v", resp.Status)
	}
	youtubeTranscript := make([]YoutubeTranscriptSentence, 0, 100)
	err = json.NewDecoder(resp.Body).Decode(&youtubeTranscript)
	if err != nil {
		return nil, errors.Wrap(err, "parsing transcript server response body")
	}
	return youtubeTranscript, nil
}
