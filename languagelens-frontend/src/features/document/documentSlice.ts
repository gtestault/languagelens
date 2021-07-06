import {postDocumentQuery, QueryState} from "./querySlice";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {fetchDocuments, postQuery, QueryRequest, QueryResponse} from "./documentAPI";
import {RootState} from "../../app/store";

export interface DocumentState {
    error: string
    documentsByName: DocumentsByName
    allDocumentNames: string[]
    isLoading: boolean
    highlightedDocument: string,
}

export interface DocumentsByName {
    [name: string]: Document
}

export interface Document {
    type: string
}


const initialState: DocumentState = {
    error: "",
    documentsByName: {},
    allDocumentNames: [],
    highlightedDocument: "",
    isLoading: false,
}

export const getDocuments = createAsyncThunk(
    'document/getDocuments',
    async (): Promise<DocumentsByName> => {
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
            if (!action.payload) {
                return
            }
            state.allDocumentNames = Object.keys(action.payload)
            state.documentsByName = action.payload
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
export const selectDocumentsByName = (state: RootState) => state.document.documentsByName;
export const selectAllDocumentNames = (state: RootState) => state.document.allDocumentNames;
export const selectHighlightedDocument = (state: RootState) => state.document.highlightedDocument;
export default documentSlice.reducer