import React from "react";
import Message from "../Message";
import {Message as MessageType, SENDER} from "../../room/roomSlice";

type GreenMessageProps = {
    msg: MessageType
}
export const GreenMessage = ({msg}: GreenMessageProps) => {
    const messageBubbleStyle = {backgroundColor: "#047857"}
    return (
        <Message key={msg.time} messageBubbleStyle={messageBubbleStyle} className="ml-2 mr-2" delivered
                 sender={SENDER.SENDER_BOT}>
            {msg.message}
        </Message>
    )
};