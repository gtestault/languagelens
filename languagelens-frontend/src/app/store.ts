import {Action, combineReducers, configureStore, ThunkAction} from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counterSlice';
import roomReducer from '../features/chat/room/roomSlice';
import queryReducer from '../features/document/querySlice';
import documentReducer from '../features/document/documentSlice';

export const store = configureStore({
    reducer: {
        counter: counterReducer,
        room: roomReducer,
        query: queryReducer,
        document: documentReducer,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType,
    RootState,
    unknown,
    Action<string>>;
