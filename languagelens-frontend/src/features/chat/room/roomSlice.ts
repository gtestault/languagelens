import Message from "../message/Message";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {RootState} from "../../../app/store";

export interface Message {
    sender: SENDER,
    message: string
    time?: number
    custom?: any
}

export interface RoomState {
    messages: Message[];
    isBotThinking: boolean
    isQuestionAnsweringMode: boolean
}

export enum SENDER {
    SENDER_BOT,
    SENDER_USER,
    SENDER_QUESTION_ANSWERING,
}

const initialBotMessage: Message = {
    sender: SENDER.SENDER_BOT,
    message: "Hello!",
    time: new Date().getTime()
}
const initialState: RoomState = {
    messages: [initialBotMessage],
    isBotThinking: false,
    isQuestionAnsweringMode: false,
};


export const roomSlice = createSlice({
    name: 'room',
    initialState,
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
        addMessage: (state, action: PayloadAction<Message>) => {
            state.messages = [...state.messages, action.payload]
            // when we get a user message, set the bot state to thinking
            state.isBotThinking = action.payload.sender === SENDER.SENDER_USER
        },
        enterQuestionAnsweringMode: (state) => {
            state.isQuestionAnsweringMode = false
        },
        exitQuestionAnsweringMode: (state) => {
            state.isQuestionAnsweringMode = false
        },
        switchRoomMode: (state) => {
            state.isQuestionAnsweringMode = !state.isQuestionAnsweringMode
        }
    }
})

export const {addMessage, enterQuestionAnsweringMode, exitQuestionAnsweringMode, switchRoomMode} = roomSlice.actions
export const selectMessages = (state: RootState) => state.room.messages;
export const selectIsBotThinking = (state: RootState) => state.room.isBotThinking;
export const selectIsQuestionAnsweringMode = (state: RootState) => state.room.isQuestionAnsweringMode;

export default roomSlice.reducer
