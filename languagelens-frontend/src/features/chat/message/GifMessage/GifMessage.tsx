import React, {SyntheticEvent} from "react";
import {message} from "antd";
import shockedGif from "../../../../assets/gif/shocked.gif"
import shockedMonkey from "../../../../assets/gif/shocked_monkey.gif"
import Message from "../Message";
import {Message as MessageType} from "../../room/roomSlice";


export enum REACTION {
   shocked= "shocked"
}
export const repository = {
    [REACTION.shocked]: [
        shockedGif,
        shockedMonkey
    ]
}
type GifMessageProps = {
    msg: MessageType
    handleGifLoaded: (e: SyntheticEvent<HTMLImageElement>) => void
}
export const GifMessage = ({msg, handleGifLoaded}: GifMessageProps) => {

    const reaction = msg.custom.gif
    const getGif = (): string => {
        if (!msg.time) return ""
        let reactionArr: string[]
        switch (reaction) {
            case REACTION.shocked:
                reactionArr = repository[REACTION.shocked]
                return reactionArr[msg.time%reactionArr.length]
        }
        return ""
    }
    return (
        <Message className="ml-2 mr-2" key={msg.time} delivered sender={msg.sender}>
            <img onLoad={handleGifLoaded} src={getGif()} alt="shocked-gif" className="max-w-full"/>
        </Message>
    )
};