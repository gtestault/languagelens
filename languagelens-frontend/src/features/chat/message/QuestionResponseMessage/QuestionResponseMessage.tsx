import React, {useEffect, useState} from "react";
import Message from "../Message";
import {Message as MessageType, SENDER} from "../../room/roomSlice";
import {fetchYoutubeTimeData, QueryAnswer, QueryResponse} from "../../../document/documentAPI";
import {message, Progress, Spin, Tag, Typography} from "antd";
import {useAppDispatch, useAppSelector} from "../../../../app/hooks";
import {
    Document,
    highlightDocument,
    removeHighlightDocument,
    selectDocumentsByName
} from "../../../document/documentSlice";

const {Text} = Typography
type QuestionResponseMessageProps = {
    msg: MessageType
    queryResponse: QueryResponse
}
export const QuestionResponseMessage = ({msg, queryResponse}: QuestionResponseMessageProps) => {
    const documents = useAppSelector(selectDocumentsByName)
    const messageBubbleStyle = {backgroundColor: "#047857", maxWidth: "30em"}
    if (!queryResponse.answers || queryResponse.answers.length == 0) {
        return (
            <Message key={msg.time} messageBubbleStyle={messageBubbleStyle} className="ml-2 mr-2" delivered
                     sender={SENDER.SENDER_BOT}>
                I could not find any answers to that question.
            </Message>
        )
    }
    const bestAnswer = queryResponse.answers[0]
    const bestAnswerDocInfo = documents[bestAnswer.meta.name]

    return (
        <Message messageBubbleStyle={messageBubbleStyle} className="ml-2 mr-2"
                 key={msg.time} delivered
                 sender={SENDER.SENDER_BOT}>

            <AnswerCard answer={bestAnswer} document={bestAnswerDocInfo}/>

        </Message>
    )
};

type AnswerCardProps = {
    answer: QueryAnswer
    document: Document
}
const AnswerCard = ({answer, document}: AnswerCardProps) => {
    const [youtubeEmbeddingLoading, setYoutubeEmbeddingLoading] = useState(false)
    const [youtubeOffsetTime, setYoutubeOffsetTime] = useState(-1)
    const dispatch = useAppDispatch()
    const contextBefore = answer.context.slice(0, answer.offset_start)
    const answerText = answer.context.slice(answer.offset_start, answer.offset_end + 1)
    const contextAfter = answer.context.slice(answer.offset_end + 1, -1)
    const stripExtension = (fileName: string) => (fileName.split(".")[0])
    const isYoutubeDocument = document.type === "YOUTUBE"
    let prob = Math.round(answer.probability * 100)

    useEffect(() => {
        fetchYoutubeTimeData(answer.meta.name, answer.offset_start_in_doc)
            .then(res => {
                const text = res.text().then(
                    youtubeOffsetTimeStr => {
                        console.log(youtubeOffsetTimeStr)
                        setYoutubeOffsetTime(+youtubeOffsetTimeStr)
                        setYoutubeEmbeddingLoading(false)
                    }
                )
            })
            .catch(e => {
                message.error(e.message())
            })
        setYoutubeEmbeddingLoading(true)
    }, [document, answer, setYoutubeOffsetTime, setYoutubeEmbeddingLoading])

    const handleMouseEnter = (e: React.SyntheticEvent<HTMLDivElement>) => {
        dispatch(highlightDocument(answer.meta.name))
    }
    const handleMouseLeave = (e: React.SyntheticEvent<HTMLDivElement>) => {
        dispatch(removeHighlightDocument())
    }

    const renderDocTitle = () => {
        const stripped = stripExtension(answer.meta.name)
        if (document.type === "YOUTUBE") {
            return "youtube.com/watch?v=" + stripped
        }
        return stripped
    }

    const renderYoutubeEmbedding = () => {
        const linkId = stripExtension(answer.meta.name)
        if (youtubeOffsetTime == -1 || youtubeEmbeddingLoading) {
            return (
                <div className="flex items-center justify-center bg-white" style={{height: "200px", width: "100%"}}>
                   <Spin tip="loading video..."/>
                </div>
            )
        }
        return (
            <iframe
                height="200px"
                width="100%"
                src={`https://www.youtube.com/embed/${linkId}?start=${youtubeOffsetTime}`}
                title="YouTube video player" frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen/>
        )
    }

    return (
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{margin: "0.75em"}}
             className="flex flex-col text-white items-center space-between">
            <div className="w-full flex flex-row items-start space-between">
                <span style={{wordWrap: "normal"}} className="flex-1 text-l ">Answer found in:</span>
                <span style={{wordWrap: "normal"}} className="flex-1 text-l ">{renderDocTitle()}</span>
            </div>
            <div className="w-full mt-4 mb-2 flex flex-row items-center space-between">
                <span style={{wordWrap: "normal"}} className="flex-1 text-l">Confidence score:</span>
                <Progress className="flex-1" type="line"
                          format={percent => <Text style={{color: "white"}}>{percent} %</Text>} style={{color: "white"}}
                          percent={prob} width={80}/>
            </div>
            <div className="leading-8 mt-4 bg-white text-black p-2">
                <span className="mr-2">[...]</span>
                {contextBefore}
                <span className="p-1 ml-1 mr-1 text-white rounded-md border-2"
                      style={{backgroundColor: "#047857", borderColor: "#047857"}}>
                    <Tag color="green">Answer:</Tag>
                    {answerText}
                    </span>
                {contextAfter}
                <span className="ml-2">[...]</span>
            </div>
            {isYoutubeDocument && renderYoutubeEmbedding()}
        </div>
    )
}