import {BASE_URL, LIST_DOCUMENTS_PATH, QUERY_PATH, YOUTUBE_DOCUMENT_TIME_DATA_PATH} from "../../constants";

export type QueryRequest = {
    query: string,
    top_k_retriever: number,
    top_k_reader: number,
}
export interface QueryResponse {
    query: string;
    answers?: (QueryAnswer)[] | null;
    selectedAnswer?: number
}
export interface QueryAnswer {
    answer: string;
    score: number;
    probability: number;
    context: string;
    offset_start: number;
    offset_end: number;
    offset_start_in_doc: number;
    offset_end_in_doc: number;
    document_id: string;
    meta: QueryAnswerMeta;
}
export interface QueryAnswerMeta {
    name: string;
}
export function postQuery(request: QueryRequest) {
    return fetch(BASE_URL + QUERY_PATH,
        {
            method: "POST",
            headers: {
               "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
        })
}

export function fetchDocuments() {
   return fetch(BASE_URL + LIST_DOCUMENTS_PATH)
}

export function fetchYoutubeTimeData(documentName: string, offsetStartInDoc: number): Promise<Response> {
    return fetch(BASE_URL + YOUTUBE_DOCUMENT_TIME_DATA_PATH, {
        method: "POST",
        headers: {
            "Content-Type" : "application/json"
        },
        body: JSON.stringify({document_name: documentName, offset_start_in_doc: offsetStartInDoc})
    })
}