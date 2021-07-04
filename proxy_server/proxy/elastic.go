package proxy

import (
	"bytes"
	"context"
	"encoding/json"
	"github.com/jjeffery/stringset"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"net/http"
)

type DocumentMetaDataResponse struct {
	Took     int  `json:"took"`
	TimedOut bool `json:"timed_out"`
	Shards   struct {
		Total      int `json:"total"`
		Successful int `json:"successful"`
		Skipped    int `json:"skipped"`
		Failed     int `json:"failed"`
	} `json:"_shards"`
	Hits struct {
		Total struct {
			Value    int    `json:"value"`
			Relation string `json:"relation"`
		} `json:"total"`
		MaxScore float64 `json:"max_score"`
		Hits     []struct {
			Index  string  `json:"_index"`
			Type   string  `json:"_type"`
			ID     string  `json:"_id"`
			Score  float64 `json:"_score"`
			Fields struct {
				Name []string `json:"name"`
			} `json:"fields"`
		} `json:"hits"`
	} `json:"hits"`
}

func (p *Proxy) HandleFetchDocuments(w http.ResponseWriter, req *http.Request) {
	docs, err := p.fetchDocumentNamesFromElasticSearch()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		log.Error(errors.Wrap(err, "handleFetchDocuments"))
	}
	err = json.NewEncoder(w).Encode(docs)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		log.Error(errors.Wrap(err, "handleFetchDocuments"))
	}
}

func (p *Proxy) fetchDocumentNamesFromElasticSearch() ([]string, error) {
	es := p.ElasticClient
	query := map[string]interface{}{
		"query": map[string]interface{}{
			"match_all": map[string]interface{}{},
		},
		"fields": []string{
			"name",
		},
		"_source": false,
	}
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(query); err != nil {
		return nil, errors.Wrap(err, "encoding query")
	}
	res, err := es.Search(
		es.Search.WithSize(10000),
		es.Search.WithContext(context.Background()),
		es.Search.WithIndex("document"),
		es.Search.WithBody(&buf),
	)
	if err != nil {
		return nil, errors.Wrap(err, "getting response")
	}
	if res.IsError() {
		var e map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
			return nil, errors.Wrap(err, "parsing response body")
		} else {
			// Print the response status and error information.
			return nil, errors.Errorf("[%s] %s: %s",
				res.Status(),
				e["error"].(map[string]interface{})["type"],
				e["error"].(map[string]interface{})["reason"],
			)
		}
	}
	var documents DocumentMetaDataResponse
	defer func() { _ = res.Body.Close() }()
	err = json.NewDecoder(res.Body).Decode(&documents)
	if err != nil {
		return nil, errors.Wrap(err, "decoding json")
	}
	// since the documents are split in multiple documents by haystack we want to get rid of duplicate document names
	uniqueDocuments := stringset.New()
	for _, doc := range documents.Hits.Hits {
		if len(doc.Fields.Name) == 0 {
			log.Warn("unexpected document without name metadata")
			continue
		}
		uniqueDocuments.Add(doc.Fields.Name[0])
	}
	docs := uniqueDocuments.Values()
	return docs, nil
}
