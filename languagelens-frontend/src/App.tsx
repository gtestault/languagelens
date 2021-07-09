import React from 'react';
import "./App.less"
import Room from "./features/chat/room/Room"
import Header from "./components/header/Header";
import {FileBrowser} from "./features/document/FileBrowser";
import {AnswersList} from "./features/answers_list/AnswersList";

function App() {
    return (
        <div className="App">
            <div className="flex flex-col h-full justify-start items-center">
                <Header className="mt-5"/>
                <div className="flex flex-row space-between w-full">
                    <FileBrowser className="flex-1 m-10" />
                    <Room className="m-10 w-1/3"/>
                    <AnswersList className="flex-1 m-10"/>
                </div>
            </div>
        </div>
    );
}

export default App;
