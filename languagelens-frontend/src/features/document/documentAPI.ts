import {BASE_URL, QUERY_PATH} from "../../constants";

export type QueryRequest = {
    query: string,
    top_k_retriever: string,
    top_k_reader: string,
}
export interface QueryResponse {
    query: string;
    answers?: (QueryAnswer)[] | null;
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