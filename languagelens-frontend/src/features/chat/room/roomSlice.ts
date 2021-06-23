import Message from "../message/Message";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {RootState} from "../../../app/store";

export interface Message {
    sender: SENDER,
    message: string
    time?: number
}

export interface RoomState {
    messages: Message[];
    isBotThinking: boolean
}

export enum SENDER {
    SENDER_BOT,
    SENDER_USER,
}

const initialBotMessage: Message = {
    sender: SENDER.SENDER_BOT,
    message: "Hi I'm Language Lens Bot. Ask me what I can do!",
    time: new Date().getTime()
}
const initialState: RoomState = {
    messages: [initialBotMessage],
    isBotThinking: false
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
        }
    }
})

export const {addMessage} = roomSlice.actions
export const selectMessages = (state: RootState) => state.room.messages;
export const selectIsBotThinking = (state: RootState) => state.room.isBotThinking;

export default roomSlice.reducer
