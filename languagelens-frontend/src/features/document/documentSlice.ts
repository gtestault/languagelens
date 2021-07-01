import {postDocumentQuery, QueryState} from "./querySlice";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {fetchDocuments, postQuery, QueryRequest, QueryResponse} from "./documentAPI";
import {RootState} from "../../app/store";

export interface DocumentState {
    error: string
    documents: string[]
    isLoading: boolean
    highlightedDocument: string,
}


const initialState: DocumentState = {
    error: "",
    documents: [],
    highlightedDocument: "",
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
    reducers: {
        highlightDocument: (state, action: PayloadAction<string>) => {
            state.highlightedDocument = action.payload
        },
        removeHighlightDocument: (state) => {
            state.highlightedDocument = ""
        }
    },
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

export const {highlightDocument, removeHighlightDocument} = documentSlice.actions
export const selectDocuments = (state: RootState) => state.document.documents;
export const selectHighlightedDocument = (state: RootState) => state.document.highlightedDocument;
export default documentSlice.reducer