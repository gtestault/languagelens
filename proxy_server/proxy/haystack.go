package proxy

import (
	"bytes"
	"encoding/json"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/http"
)

const (
	HAYSTACK_API_BASE_URL    = "http://127.0.0.1:8000"
	HAYSTACK_API_UPLOAD_PATH = "/file-upload"
	HAYSTACK_API_QUERY_PATH  = "/query"
)

type HaystackQueryResponse struct {
	Query   string                `json:"query"`
	Answers []HaystackQueryAnswer `json:"answers"`
}
type HaystackQueryAnswer struct {
	Answer           string  `json:"answer"`
	Score            float64 `json:"score"`
	Probability      float64 `json:"probability"`
	Context          string  `json:"context"`
	OffsetStart      int     `json:"offset_start"`
	OffsetEnd        int     `json:"offset_end"`
	OffsetStartInDoc int     `json:"offset_start_in_doc"`
	OffsetEndInDoc   int     `json:"offset_end_in_doc"`
	DocumentId       string  `json:"document_id"`
	Meta             struct {
		Name string `json:"name"`
	} `json:"meta"`
}
type HaystackQueryRequest struct {
	Query         string            `json:"query"`
	Filters       map[string]string `json:"filters"`
	TopKRetriever string            `json:"top_k_retriever"`
	TopKReader    string            `json:"top_k_reader"`
}

// The Content-Type for an HTTP multipart/form-data with boundary of multipart.Writer
type contentType string

func errFromStatusCode(resp *http.Response) error {
	if resp.StatusCode > 200 {
		proxyErrResp, _ := ioutil.ReadAll(resp.Body)
		return errors.Errorf("haystack wrong status code: %v, messsage: %v", resp.Status, string(proxyErrResp))
	}
	return nil
}
func formFileToBuffer(fh *multipart.FileHeader) (*bytes.Buffer, contentType, error) {
	errLabel := "form file to buffer conversion"
	f, err := fh.Open()
	defer func() { _ = f.Close() }()
	if err != nil {
		return nil, "", errors.Wrap(err, errLabel)
	}
	proxyReqBody := &bytes.Buffer{}
	formWriter := multipart.NewWriter(proxyReqBody)
	defer func() { _ = formWriter.Close() }()
	fw, err := formWriter.CreateFormFile("file", fh.Filename)
	if err != nil {
		return nil, "", errors.Wrap(err, errLabel)
	}
	_, err = io.Copy(fw, f)
	if err != nil {
		return nil, "", errors.Wrap(err, errLabel)
	}
	return proxyReqBody, contentType(formWriter.FormDataContentType()), err
}
func (r *Proxy) haystackFileUpload(buff *bytes.Buffer, ct contentType) error {
	errLabel := "proxying request to haystack"
	proxyReq, err := http.NewRequest(http.MethodPost, HAYSTACK_API_BASE_URL+HAYSTACK_API_UPLOAD_PATH, bytes.NewReader(buff.Bytes()))
	if err != nil {
		return errors.Wrap(err, errLabel)
	}
	proxyReq.Header.Set("Content-Type", string(ct))
	proxyResp, err := r.Client.Do(proxyReq)
	if err != nil {
		return errors.Wrap(err, errLabel)
	}
	err = errFromStatusCode(proxyResp)
	if err != nil {
		return errors.Wrap(err, errLabel)
	}
	return nil
}
func (r *Proxy) proxyFileToHaystack(fh *multipart.FileHeader) error {
	buff, contentType, err := formFileToBuffer(fh)
	if err != nil {
		return err
	}
	err = r.haystackFileUpload(buff, contentType)
	if err != nil {
		return err
	}
	return nil
}
func (r *Proxy) HandleFileUpload(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "multipart/form-data")
	err := req.ParseMultipartForm(32 << 20) // 32MB is the default used by FormFile
	if err != nil {
		log.Warn(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	fhs := req.MultipartForm.File["files"]
	for _, fh := range fhs {
		err = r.proxyFileToHaystack(fh)
		if err != nil {
			log.Warn(errors.Wrap(err, "haystack file proxy failed"))
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		log.Info("successful file proxy to haystack")
	}
}

func (r *Proxy) proxyQueryToHaystack(w http.ResponseWriter, req *http.Request) error {
	buff := &bytes.Buffer{}
	_, err := io.Copy(buff, req.Body)
	if err != nil {
		return err
	}
	proxyReq, err := http.NewRequest(http.MethodPost, HAYSTACK_API_BASE_URL+HAYSTACK_API_QUERY_PATH, bytes.NewReader(buff.Bytes()))
	if err != nil {
		return err
	}
	proxyReq.Header.Set("Content-Type", "application/json")
	proxyResp, err := r.Client.Do(proxyReq)
	if err != nil {
		return err
	}
	err = errFromStatusCode(proxyResp)
	if err != nil {
		return err
	}
	w.Header().Set("Content-Type", "application/json")
	queryResp := &HaystackQueryResponse{}
	err = json.NewDecoder(proxyResp.Body).Decode(&queryResp)
	if err != nil {
		return err
	}
	err = json.NewEncoder(w).Encode(queryResp)
	if err != nil {
		return err
	}
	return nil
}

func (r *Proxy) HandleQuery(w http.ResponseWriter, req *http.Request) {
	err := r.proxyQueryToHaystack(w, req)
	if err != nil {
		log.Warn(errors.Wrap(err, "proxying query to haystack"))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	log.Info("successful query proxy to haystack")
}
