import React, {SyntheticEvent} from "react";
import shockedGif from "../../../../assets/gif/shocked.gif"
import shockedMonkey from "../../../../assets/gif/shocked_monkey.gif"
import goodbye1Gif from "../../../../assets/gif/goodbye1.gif"
import sadGif from "../../../../assets/gif/sad.gif"
import goodbye2Gif from "../../../../assets/gif/goodbye2.gif"
import yourwelcome from "../../../../assets/gif/np.gif"
import Message from "../Message";
import {Message as MessageType} from "../../room/roomSlice";


export enum REACTION {
    shocked = "shocked",
    goodbye = "goodbye",
    sad = "sad",
    yourWelcome = "your_welcome",
}

export const repository = {
    [REACTION.shocked]: [
        shockedGif,
        shockedMonkey
    ],

    [REACTION.goodbye]: [
        goodbye1Gif,
        goodbye2Gif,
    ],

    [REACTION.sad]: [
        sadGif,
    ],

    [REACTION.yourWelcome]: [
        yourwelcome,
    ]
}
type GifMessageProps = {
    msg: MessageType
    handleGifLoaded: (e: SyntheticEvent<HTMLImageElement>) => void
}
export const GifMessage = ({msg, handleGifLoaded}: GifMessageProps) => {

    const reaction = (msg.custom.gif as REACTION)
    const getGif = (): string => {
        if (!msg.time) return ""
        let reactionArr: string[] = repository[reaction]
        return reactionArr[msg.time % reactionArr.length]
    }
    return (
        <Message className="ml-2 mr-2" key={msg.time} delivered sender={msg.sender}>
            <img onLoad={handleGifLoaded} src={getGif()} alt="gif" className="max-w-full"/>
        </Message>
    )
};