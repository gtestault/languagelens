package proxy

import (
	"bytes"
	"callback_server/proxy/utils"
	"context"
	"encoding/base64"
	"encoding/json"
	"github.com/elastic/go-elasticsearch/esapi"
	"github.com/jjeffery/stringset"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"net/http"
)

type ElasticSearchDocumentMetaDataResponse struct {
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
				Type []string `json:"type"`
			} `json:"fields"`
		} `json:"hits"`
	} `json:"hits"`
}

type ElasticSearchYoutubeTimeResponse struct {
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
			Source struct {
				Text    string `json:"text"`
				Type    string `json:"type"`
				Extra   string `json:"extra"`
				Name    string `json:"name"`
				SplitID int    `json:"_split_id"`
			} `json:"_source"`
			Fields struct {
				Name []string `json:"name"`
			} `json:"fields"`
		} `json:"hits"`
	} `json:"hits"`
}

type Document struct {
	Type string `json:"type"`
}

func elasticSearchErrorToGoError(res *esapi.Response) error {
	if !res.IsError() {
		return nil
	}
	var e map[string]interface{}
	if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
		return errors.Wrap(err, "parsing response body")
	} else {
		// Print the response status and error information.
		return errors.Errorf("[%s] %s: %s",
			res.Status(),
			e["error"].(map[string]interface{})["type"],
			e["error"].(map[string]interface{})["reason"],
		)
	}
}

func (p *Proxy) fetchDocumentNamesFromElasticSearch() (map[string]Document, error) {
	es := p.ElasticClient
	query := map[string]interface{}{
		"query": map[string]interface{}{
			"match_all": map[string]interface{}{},
		},
		"fields": []string{
			"name",
			"type",
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
	err = elasticSearchErrorToGoError(res)
	if err != nil {
		return nil, err
	}
	var elasticDocuments ElasticSearchDocumentMetaDataResponse
	defer func() { _ = res.Body.Close() }()
	err = json.NewDecoder(res.Body).Decode(&elasticDocuments)
	if err != nil {
		return nil, errors.Wrap(err, "decoding json")
	}
	// since the documents are split in multiple documents by haystack we want to get rid of duplicate document names
	uniqueDocuments := stringset.New()
	documents := make(map[string]Document)
	for _, elasticDoc := range elasticDocuments.Hits.Hits {
		if (len(elasticDoc.Fields.Name) == 0) || len(elasticDoc.Fields.Type) == 0 {
			log.Warn("unexpected document with missing type or name metadata")
			continue
		}
		docName := elasticDoc.Fields.Name[0]
		docType := elasticDoc.Fields.Type[0]
		if !uniqueDocuments.Contains(docName) {
			uniqueDocuments.Add(docName)
			documents[docName] = Document{Type: docType}
		}
		uniqueDocuments.Add(elasticDoc.Fields.Name[0])
	}
	return documents, nil
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

func (p *Proxy) fetchYoutubeSparseTimeArrayFromElasticSearch(documentName string) (*utils.SparseIntArray, error) {
	es := p.ElasticClient
	query := map[string]interface{}{
		"query": map[string]interface{}{
			"match": map[string]interface{}{
				"name": map[string]string{
					"query": documentName, //TODO: check if injection possible from query in elastic search
				},
			},
		},
		"fields": []string{
			"name",
			"_meta",
		},
		"_source": true,
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
	err = elasticSearchErrorToGoError(res)
	if err != nil {
		return nil, err

	}
	var youtubeTimeResponse ElasticSearchYoutubeTimeResponse
	defer func() { _ = res.Body.Close() }()
	err = json.NewDecoder(res.Body).Decode(&youtubeTimeResponse)
	if err != nil {
		return nil, errors.Wrap(err, "decoding json")
	}
	if len(youtubeTimeResponse.Hits.Hits) == 0 {
		return nil, errors.New("no hits for query")
	}
	base64EncodedTimeArray := youtubeTimeResponse.Hits.Hits[0].Source.Extra
	jsonEncodedTimeArray, err := base64.StdEncoding.DecodeString(base64EncodedTimeArray)
	if err != nil {
		return nil, errors.Wrap(err, "decoding base64")
	}
	timeArray, err := utils.NewSparseIntArrayFromJSON(jsonEncodedTimeArray)
	if err != nil {
		return nil, errors.Wrap(err, "decoding json")
	}
	return timeArray, nil
}

type TimeForYoutubeDocumentRequest struct {
	OffsetStartInDoc int    `json:"offset_start_in_doc"`
	DocumentName     string `json:"document_name"`
}

func (p *Proxy) fetchTimeForYoutubeDocument(w http.ResponseWriter, req *http.Request) error {
	var ytTimeRequest TimeForYoutubeDocumentRequest
	err := json.NewDecoder(req.Body).Decode(&ytTimeRequest)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return errors.Wrap(err, "json parsing of request")
	}
	timeArray, err := p.fetchYoutubeSparseTimeArrayFromElasticSearch(ytTimeRequest.DocumentName)
	if err != nil {
		return errors.Wrap(err, "fetching time metadata from elastic search")
	}
	timeInSeconds, ok := timeArray.FindEntry(ytTimeRequest.OffsetStartInDoc)
	if !ok {
		w.WriteHeader(http.StatusInternalServerError)
		return errors.Wrap(err, "unexpected empty time array")
	}
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(timeInSeconds)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return errors.Wrap(err, "encoding json response")
	}
	return nil
}

func (p *Proxy) HandleFetchTimeForYoutubeDocument(w http.ResponseWriter, req *http.Request) {
	err := p.fetchTimeForYoutubeDocument(w, req)
	if err != nil {
		log.Error(errors.Wrap(err, "handleFetchTimeForYoutubeDocument"))
	}
}
