package proxy

import (
	"callback_server/proxy/utils"
	"encoding/base64"
	"encoding/json"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"strings"
)

const (
	YOUTUBE_TRANSCRIPT_SERVER_BASE_URL = "http://localhost:5035"
	FILE_TYPE_YOUTUBE                  = "YOUTUBE"
)

type YoutubeTranscriptSentence struct {
	Text     string  `json:"text"`
	Start    float64 `json:"start"`
	Duration float64 `json:"duration"`
}

type YoutubeTranscript []YoutubeTranscriptSentence

type YoutubeTranscriptDocument struct {
	Text string
	Meta *FileMetadata
}

func (yt YoutubeTranscript) ToDocWithMeta() *YoutubeTranscriptDocument {
	document := &YoutubeTranscriptDocument{}
	var docSize int
	for _, s := range yt {
		docSize += len(s.Text)
	}
	var b strings.Builder
	timeMeta := utils.NewSparseIntArray()
	b.Grow(docSize)
	docSize = 0
	for _, s := range yt {
		timeMeta.AddEntry(docSize, int(s.Start))
		cleanText := " " + strings.ReplaceAll(s.Text, "\n", " ")
		document.Text += cleanText
		docSize += len(cleanText)
	}

	metadata, err := timeMeta.ToJSON()
	if err != nil {
		log.Error(errors.Wrap(err, "toDocWithMeta"))
		metadata = []byte("")
	}
	document.Meta = &FileMetadata{Type: FILE_TYPE_YOUTUBE, Meta: base64.StdEncoding.EncodeToString(metadata)}
	return document
}

func (p *Proxy) FetchYoutubeTranscriptDocument(id string) (*YoutubeTranscriptDocument, error) {
	transcript, err := p.fetchYoutubeTranscript(id)
	if err != nil {
		return nil, errors.Wrap(err, "proxy: youtube-transcript-server")
	}
	doc := transcript.ToDocWithMeta()
	return doc, nil
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
