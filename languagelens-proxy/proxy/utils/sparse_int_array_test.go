package utils

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestSparseIntArray(t *testing.T) {
	s := NewSparseIntArray().
		AddEntry(0, 0).
		AddEntry(100, 20).
		AddEntry(15, 5).
		AddEntry(200, 50)
	doTests(t, s)
}

func doTests(t *testing.T, s *SparseIntArray) {
	find1, ok := s.FindEntry(0)
	assert.True(t, ok)
	assert.Equal(t, 0, find1)

	find2, ok := s.FindEntry(14)
	assert.True(t, ok)
	assert.Equal(t, 0, find2)

	find3, ok := s.FindEntry(15)
	assert.True(t, ok)
	assert.Equal(t, 5, find3)

	find4, ok := s.FindEntry(16)
	assert.True(t, ok)
	assert.Equal(t, 5, find4)

	find5, ok := s.FindEntry(250)
	assert.True(t, ok)
	assert.Equal(t, 50, find5)

}

func TestSerialization(t *testing.T) {
	s := NewSparseIntArray().
		AddEntry(0, 0).
		AddEntry(100, 20).
		AddEntry(15, 5).
		AddEntry(200, 50)
	jsonBytes, err := s.ToJSON()
	stringRepr := string(jsonBytes)
	t.Log(stringRepr)
	assert.NoError(t, err)
	s2, err := NewSparseIntArrayFromJSON(jsonBytes)
	assert.NoError(t, err)
	doTests(t, s2)
}
