import React from "react";
import Message from "../Message";
import {Message as MessageType} from "../../room/roomSlice";
import {Tag} from "antd";

type QuestionMessageProps = {
    msg: MessageType
}
export const QuestionMessage = ({msg}: QuestionMessageProps) => {
    return (
        <Message messageBubbleStyle={{backgroundColor: "#047857"}} className="ml-2 mr-2" key={msg.time} delivered sender={msg.sender}>
            <Tag color="green">
                Question:
            </Tag>
            {msg.message}
        </Message>
    )
};