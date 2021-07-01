import React, {useEffect} from "react";
import Message from "../Message";
import {Message as MessageType, SENDER} from "../../room/roomSlice";
import {QueryAnswer, QueryResponse} from "../../../document/documentAPI";
import {Card, Progress, Tag, Typography} from "antd";

const {Text} = Typography
type QuestionResponseMessageProps = {
    msg: MessageType
    queryResponse: QueryResponse
}
export const QuestionResponseMessage = ({msg, queryResponse}: QuestionResponseMessageProps) => {
    const messageBubbleStyle = {backgroundColor: "#047857", maxWidth: "30em"}
    if (!queryResponse.answers || queryResponse.answers.length == 0) {
        return (
            <Message key={msg.time} messageBubbleStyle={messageBubbleStyle} className="ml-2 mr-2" delivered sender={SENDER.SENDER_BOT}>
                I could not find any answers to that question.
            </Message>
        )
    }

    const bestAnswer = queryResponse.answers[0]


    return (
        <Message messageBubbleStyle={messageBubbleStyle} className="ml-2 mr-2"
                 key={msg.time} delivered
                 sender={SENDER.SENDER_BOT}>

            <AnswerCard answer={bestAnswer}/>

        </Message>
    )
};

type AnswerCardProps = {
    answer: QueryAnswer
}
const AnswerCard = ({answer}: AnswerCardProps) => {
    const contextBefore = answer.context.slice(0, answer.offset_start)
    const answerText = answer.context.slice(answer.offset_start, answer.offset_end + 1)
    const contextAfter = answer.context.slice(answer.offset_end + 1, -1)
    let prob = Math.round(answer.probability* 100)
    return (
        <Card style={{margin: "0.75em"}}>
            <div className="flex flex-col items-center space-between">
                <div className="text-lg font-semibold">Answer found in: </div>
                <Text style={{margin: 0}} code>{answer.meta.name}</Text>
                <div className="w-full mt-4 mb-2 flex flex-row items-center space-between">
                    <span style={{width: "20em", wordWrap: "normal"}} className="text-l font-semibold">Confidence score:</span>
                    <Progress type="line" percent={prob} width={80} />
                </div>
                <div className="leading-8 mt-4 ring rounded-md ring-green-900 p-2">
                    {contextBefore}
                    <span className="p-1 ml-1 mr-1 text-white rounded-md border-2" style={{backgroundColor: "#047857", borderColor: "#047857"}}>
                    <Tag color="green">Answer:</Tag>
                        {answerText}
                    </span>
                    {contextAfter}
                </div>
            </div>
        </Card>
    )
}