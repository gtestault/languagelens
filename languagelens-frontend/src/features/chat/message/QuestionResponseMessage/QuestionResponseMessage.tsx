import React, {useEffect} from "react";
import Message from "../Message";
import {Message as MessageType, SENDER} from "../../room/roomSlice";
import {QueryAnswer, QueryResponse} from "../../../document/documentAPI";
import {Card, Progress, Tag, Typography} from "antd";
import {useAppDispatch} from "../../../../app/hooks";
import {highlightDocument, removeHighlightDocument} from "../../../document/documentSlice";

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
    const disptach = useAppDispatch()
    const contextBefore = answer.context.slice(0, answer.offset_start)
    const answerText = answer.context.slice(answer.offset_start, answer.offset_end + 1)
    const contextAfter = answer.context.slice(answer.offset_end + 1, -1)
    let prob = Math.round(answer.probability* 100)
    const handleMouseEnter = (e: React.SyntheticEvent<HTMLDivElement>) => {
        disptach(highlightDocument(answer.meta.name))
    }
    const handleMouseLeave = (e: React.SyntheticEvent<HTMLDivElement>) => {
        disptach(removeHighlightDocument())
    }
    return (
            <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{margin: "0.75em"}} className="flex flex-col text-white items-center space-between">
                <div className="w-full flex flex-row items-start space-between">
                    <span style={{wordWrap: "normal"}} className="flex-1 text-l ">Answer found in:</span>
                    <span style={{wordWrap: "normal"}} className="flex-1 text-l ">{answer.meta.name}</span>
                </div>
                <div className="w-full mt-4 mb-2 flex flex-row items-center space-between">
                    <span style={{wordWrap: "normal"}} className="flex-1 text-l">Confidence score:</span>
                    <Progress className="flex-1" type="line" format={percent => <Text style={{color: "white"}}>{percent} %</Text>} style={{color: "white"}} percent={prob} width={80} />
                </div>
                <div className="leading-8 mt-4 bg-white text-black p-2">
                    <span className="mr-2">[...]</span>
                    {contextBefore}
                    <span className="p-1 ml-1 mr-1 text-white rounded-md border-2" style={{backgroundColor: "#047857", borderColor: "#047857"}}>
                    <Tag color="green">Answer:</Tag>
                        {answerText}
                    </span>
                    {contextAfter}
                    <span className="ml-2">[...]</span>
                </div>
            </div>
    )
}