import React from 'react';
import logo from './logo.svg';
import {Counter} from './features/counter/Counter';
import {Button} from "antd";
import "./App.less"
import Room from "./features/chat/room/Room"
import Header from "./components/header/Header";

function App() {
    return (
        <div className="App">
            <div className="flex flex-col h-full justify-start items-center">
                <Header className="mt-5"/>
                <Room className="p-2 m-10"/>
            </div>
        </div>
    );
}

export default App;
