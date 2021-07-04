package utils

import (
	"encoding/json"
	"sort"
)

type SparseIntArray struct {
	m map[int]int
}

func NewSparseIntArray() *SparseIntArray {
	m := make(map[int]int)
	return &SparseIntArray{m: m}
}

func (s *SparseIntArray) AddEntry(key int, value int) *SparseIntArray {
	s.m[key] = value
	return s
}

func (s *SparseIntArray) FindEntry(userKey int) (int, bool) {
	if userKey < 0 {
		return -1, false
	}
	keys := make([]int, 0, len(s.m))
	for k := range s.m {
		keys = append(keys, k)
	}
	sort.Ints(keys)
	//TODO: replace linear search with custom binary search (overkill for my youtube use case since max 10k elements in keys)
	prevKey := -1
	for _, k := range keys {
		if k == userKey {
			return s.m[k], true
		}
		if k > userKey {
			if prevKey == -1 {
				return -1, false
			}
			return s.m[prevKey], true
		}
		prevKey = k
	}
	return s.m[keys[len(keys)-1]], true
}

func (s *SparseIntArray) ToJSON() ([]byte, error) {
	return json.Marshal(s.m)
}

func NewSparseIntArrayFromJSON(jsonBytes []byte) (*SparseIntArray, error) {
	s := &SparseIntArray{}
	err := json.Unmarshal(jsonBytes, &s.m)
	if err != nil {
		return nil, err
	}
	return s, nil
}
