import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {fetchCount} from "../counter/counterAPI";
import {postQuery, QueryRequest, QueryResponse} from "./documentAPI";

export interface QueryState {
    error: string
    queryResponse: QueryResponse | null
    isLoading: boolean
}

const initialState: QueryState = {
    error: "",
    queryResponse: null,
    isLoading: false,
}


export const postDocumentQuery = createAsyncThunk(
    'document/queryRequest',
    async (query: QueryRequest): Promise<QueryResponse> => {
        const response = await postQuery(query);
        // The value we return becomes the `fulfilled` action payload
        return response.json();
    }
);

const querySlice = createSlice({
    name: "document",
    initialState: initialState,
    reducers: {
    },
    extraReducers: (builder) => {
        builder.addCase(postDocumentQuery.fulfilled, (state, action) => {
            state.error = ""
            state.isLoading = false
            state.queryResponse = action.payload
        })
        builder.addCase(postDocumentQuery.pending, (state, action) => {
            state.error = ""
            state.isLoading = true
        })
        builder.addCase(postDocumentQuery.rejected, (state, action) => {
            if (action.error && action.error.message) {
                state.error = action.error.message
            } else {
                state.error = "unknown error"
            }
            state.isLoading = false
        })
    }

})