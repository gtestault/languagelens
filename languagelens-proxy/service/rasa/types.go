package rasa

type ActionRejectedError struct {
	ActionName string `json:"action_name"`
	Error      string `json:"error"`
}
type TextResponse struct {
	Text string `json:"text"`
}
type YoutubeResponse struct {
	Custom YoutubeResponseCustomPayload `json:"custom"`
}
type YoutubeResponseCustomPayload struct {
	Type   string `json:"type"`
	LinkId string `json:"link_id"`
}
type Event struct {
	Event string  `json:"event"`
	Name  string  `json:"name"`
	Value *string `json:"value"`
}
type ActionServerReturnedObject struct {
	Events    []Event       `json:"events"`
	Responses []interface{} `json:"responses"`
}

func (as *ActionServer) NewTextResponse(text string) *ActionServerReturnedObject {
	responses := make([]interface{}, 0, 1)
	events := make([]Event, 0, 1)
	responses = append(responses, TextResponse{text})
	events = append(events, Event{Event: "slot", Name: "youtube_link", Value: nil})
	obj := &ActionServerReturnedObject{Events: events, Responses: responses}
	return obj
}

func (as *ActionServer) NewYoutubeResponse(linkId string) *ActionServerReturnedObject {
	responses := make([]interface{}, 0, 1)
	events := make([]Event, 0, 1)
	responses = append(responses, YoutubeResponse{
		Custom: YoutubeResponseCustomPayload{
			Type:   "youtube",
			LinkId: linkId,
		},
	})
	events = append(events, Event{Event: "slot", Name: "youtube_link", Value: nil})
	obj := &ActionServerReturnedObject{Events: events, Responses: responses}
	return obj
}

type ActionServerInput struct {
	NextAction string `json:"next_action"`
	SenderID   string `json:"sender_id"`
	Tracker    struct {
		SenderID string `json:"sender_id"`
		Slots    struct {
			SessionStartedMetadata interface{} `json:"session_started_metadata"`
			YoutubeLink            string      `json:"youtube_link"`
		} `json:"slots"`
		LatestMessage struct {
			Intent struct {
				ID         int64   `json:"id"`
				Name       string  `json:"name"`
				Confidence float64 `json:"confidence"`
			} `json:"intent"`
			Entities []struct {
				Entity           string  `json:"entity"`
				Start            int     `json:"start"`
				End              int     `json:"end"`
				ConfidenceEntity float64 `json:"confidence_entity"`
				Value            string  `json:"value"`
				Extractor        string  `json:"extractor"`
			} `json:"entities"`
			Text      string `json:"text"`
			MessageID string `json:"message_id"`
			Metadata  struct {
			} `json:"metadata"`
			IntentRanking []struct {
				ID         int64   `json:"id"`
				Name       string  `json:"name"`
				Confidence float64 `json:"confidence"`
			} `json:"intent_ranking"`
			ResponseSelector struct {
				AllRetrievalIntents []interface{} `json:"all_retrieval_intents"`
				Default             struct {
					Response struct {
						ID                interface{} `json:"id"`
						Responses         interface{} `json:"responses"`
						ResponseTemplates interface{} `json:"response_templates"`
						Confidence        float64     `json:"confidence"`
						IntentResponseKey interface{} `json:"intent_response_key"`
						UtterAction       string      `json:"utter_action"`
						TemplateName      string      `json:"template_name"`
					} `json:"response"`
					Ranking []interface{} `json:"ranking"`
				} `json:"default"`
			} `json:"response_selector"`
		} `json:"latest_message"`
		LatestEventTime float64     `json:"latest_event_time"`
		FollowupAction  interface{} `json:"followup_action"`
		Paused          bool        `json:"paused"`
		Events          []struct {
			Event        string      `json:"event"`
			Timestamp    float64     `json:"timestamp"`
			Name         string      `json:"name,omitempty"`
			Policy       interface{} `json:"policy,omitempty"`
			Confidence   float64     `json:"confidence,omitempty"`
			ActionText   interface{} `json:"action_text,omitempty"`
			HideRuleTurn bool        `json:"hide_rule_turn,omitempty"`
			Text         string      `json:"text,omitempty"`
			ParseData    struct {
				Intent struct {
					ID         int64   `json:"id"`
					Name       string  `json:"name"`
					Confidence float64 `json:"confidence"`
				} `json:"intent"`
				Entities []struct {
					Entity           string  `json:"entity"`
					Start            int     `json:"start"`
					End              int     `json:"end"`
					ConfidenceEntity float64 `json:"confidence_entity"`
					Value            string  `json:"value"`
					Extractor        string  `json:"extractor"`
				} `json:"entities"`
				Text      string `json:"text"`
				MessageID string `json:"message_id"`
				Metadata  struct {
				} `json:"metadata"`
				IntentRanking []struct {
					ID         int64   `json:"id"`
					Name       string  `json:"name"`
					Confidence float64 `json:"confidence"`
				} `json:"intent_ranking"`
				ResponseSelector struct {
					AllRetrievalIntents []interface{} `json:"all_retrieval_intents"`
					Default             struct {
						Response struct {
							ID                interface{} `json:"id"`
							Responses         interface{} `json:"responses"`
							ResponseTemplates interface{} `json:"response_templates"`
							Confidence        float64     `json:"confidence"`
							IntentResponseKey interface{} `json:"intent_response_key"`
							UtterAction       string      `json:"utter_action"`
							TemplateName      string      `json:"template_name"`
						} `json:"response"`
						Ranking []interface{} `json:"ranking"`
					} `json:"default"`
				} `json:"response_selector"`
			} `json:"parse_data,omitempty"`
			InputChannel string `json:"input_channel,omitempty"`
			MessageID    string `json:"message_id,omitempty"`
			Metadata     struct {
			} `json:"metadata,omitempty"`
			UseTextForFeaturization bool `json:"use_text_for_featurization,omitempty"`
		} `json:"events"`
		LatestInputChannel string `json:"latest_input_channel"`
		ActiveLoop         struct {
		} `json:"active_loop"`
		LatestAction struct {
			ActionName string `json:"action_name"`
		} `json:"latest_action"`
		LatestActionName string `json:"latest_action_name"`
	} `json:"tracker"`
	Version string `json:"version"`
}
