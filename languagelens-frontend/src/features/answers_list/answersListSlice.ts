import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {RootState} from "../../app/store";
import {QueryAnswer, QueryResponse} from "../document/documentAPI";
import {sortQueryAnswersByProbability} from "../../utils/query_answer";

export interface AnswersListState {
    isVisible: boolean
    queryResponse: QueryResponse | null,
    queryTime: number
}

const initialState: AnswersListState = {
    isVisible: false,
    queryResponse: null,
    queryTime: 0,
}

export interface ShowResultsListActionPayload {
    queryResponse: QueryResponse
    time: number
}

const answersListSlice = createSlice({
    name: "document",
    initialState: initialState,
    reducers: {
        showResultsList: (state, action: PayloadAction<ShowResultsListActionPayload>) => {
            if (!action.payload.queryResponse.answers) return
            let responseList = action.payload.queryResponse.answers.slice()
            state.queryResponse = {...action.payload.queryResponse, answers: responseList.sort(sortQueryAnswersByProbability)}
            state.queryTime = action.payload.time
            state.isVisible = true
        },
        hideResultsList: (state) => {
            state.isVisible = false
            state.queryResponse = null
        }
    },
})

export const {showResultsList, hideResultsList} = answersListSlice.actions
export const selectIsResultsListVisible = (state: RootState) => state.answersList.isVisible;
export const selectAnswersListQueryTime = (state: RootState) => state.answersList.queryTime;
export const selectAnswersListQueryResponse = (state: RootState) => state.answersList.queryResponse;
export default answersListSlice.reducer