import {postDocumentQuery, QueryState} from "./querySlice";
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {fetchDocuments, postQuery, QueryRequest, QueryResponse} from "./documentAPI";
import {RootState} from "../../app/store";

export interface DocumentState {
    error: string
    documents: string[]
    isLoading: boolean
}


const initialState: DocumentState = {
    error: "",
    documents: [],
    isLoading: false,
}

export const getDocuments = createAsyncThunk(
    'document/getDocuments',
    async (): Promise<string[]> => {
        const response = await fetchDocuments();
        // The value we return becomes the `fulfilled` action payload
        return response.json();
    }
);

const documentSlice = createSlice({
    name: "document",
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getDocuments.fulfilled, (state, action) => {
            state.error = ""
            state.isLoading = false
            state.documents = action.payload
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

export const selectDocuments = (state: RootState) => state.document.documents;
export default documentSlice.reducer