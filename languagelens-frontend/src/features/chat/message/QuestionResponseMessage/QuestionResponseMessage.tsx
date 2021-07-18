import React, {useEffect, useState} from "react";
import Message from "../Message";
import {Message as MessageType, SENDER} from "../../room/roomSlice";
import {fetchYoutubeTimeData, QueryAnswer, QueryResponse} from "../../../document/documentAPI";
import {Button, message, Progress, Spin, Typography} from "antd";
import {useAppDispatch, useAppSelector} from "../../../../app/hooks";
import {CaretDownOutlined, SyncOutlined} from "@ant-design/icons";
import {
    Document,
    highlightDocument,
    removeHighlightDocument,
    selectDocumentsByName
} from "../../../document/documentSlice";
import {showResultsList} from "../../../answers_list/answersListSlice";
import YouTube from "react-youtube";
import YouTubePlayer from "youtube-player/dist/types";
import {youtubeDocNameToYoutubeLink} from "../../../../utils/youtube";
import {sortQueryAnswersByProbability} from "../../../../utils/query_answer";

const {Text} = Typography
type QuestionResponseMessageProps = {
    msg: MessageType
    queryResponse: QueryResponse
}
export const QuestionResponseMessage = ({msg, queryResponse}: QuestionResponseMessageProps) => {
    const documents = useAppSelector(selectDocumentsByName)
    const dispatch = useAppDispatch()
    const messageBubbleStyle = {backgroundColor: "#047857", maxWidth: "30em"}
    if (!queryResponse.answers || queryResponse.answers.length == 0) {
        return (
            <Message key={msg.time} messageBubbleStyle={messageBubbleStyle} className="ml-2 mr-2" delivered
                     sender={SENDER.SENDER_BOT}>
                I could not find any answers to that question.
            </Message>
        )
    }
    const handleShowResultsList = () => {
        if (!msg.time) {
            message.error("Time of question response is missing in bot answer")
            return
        }
        dispatch(showResultsList({queryResponse: queryResponse, time: msg.time}))
    }
    const answersSorted = [...queryResponse.answers].sort(sortQueryAnswersByProbability)
    const selectedAnswer = queryResponse.selectedAnswer ? answersSorted[queryResponse.selectedAnswer] : answersSorted[0]
    const selectedAnswerDoc = documents[selectedAnswer.meta.name]

    return (
        <Message messageBubbleStyle={messageBubbleStyle} className="ml-2 mr-2"
                 key={msg.time} delivered
                 sender={SENDER.SENDER_BOT}>

            <AnswerCard answer={selectedAnswer} document={selectedAnswerDoc} onShowResultsList={handleShowResultsList}/>

        </Message>
    )
};

type AnswerCardProps = {
    answer: QueryAnswer
    document: Document
    onShowResultsList: () => void
}
const AnswerCard = ({answer, document, onShowResultsList}: AnswerCardProps) => {
    const [youtubeEmbeddingLoading, setYoutubeEmbeddingLoading] = useState(false)
    const [youtubeOffsetTime, setYoutubeOffsetTime] = useState(-1)
    const [youtubePlayer, setYoutubePlayer] = useState<YouTubePlayer.YouTubePlayer | null>(null)
    const [youtubeProgressTime, setYoutubeProgressTime] = useState(0)
    const dispatch = useAppDispatch()
    const contextBefore = answer.context.slice(0, answer.offset_start)
    const answerText = answer.context.slice(answer.offset_start, answer.offset_end + 1)
    const contextAfter = answer.context.slice(answer.offset_end + 1, -1)
    const stripExtension = (fileName: string) => (fileName.split(".")[0])
    const isYoutubeDocument = document.type && document.type === "YOUTUBE"
    const prob = Math.round(answer.probability * 100)
    const youtubeAnswerStartTime = Math.max(0, youtubeOffsetTime - 10)

    useEffect(() => {
        let ytProgress = setInterval(() => {
            if (youtubePlayer === null) return
            setYoutubeProgressTime(youtubePlayer.getCurrentTime())
        }, 250)
        return () => {
            clearInterval(ytProgress)
        }
    }, [youtubePlayer])

    useEffect(() => {
        fetchYoutubeTimeData(answer.meta.name, answer.offset_start_in_doc)
            .then(res => {
                const text = res.text().then(
                    youtubeOffsetTimeStr => {
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
    const handleRewindYoutube = () => {
        if (youtubePlayer === null) {
            return
        }
        youtubePlayer!.seekTo(youtubeAnswerStartTime, true)
    }

    const renderDocTitle = () => {
        const stripped = stripExtension(answer.meta.name)
        if (isYoutubeDocument) {
            return youtubeDocNameToYoutubeLink(answer.meta.name)
        }
        return stripped
    }

    const humanizeTime = (seconds: number): string => {
        if (seconds/60 < 1) {
           return seconds + "s"
        }
        return `${Math.floor(seconds / 60)}m${seconds % 60}s`
    }
    const renderAnswerCountDown = () => {
        const diff = Math.floor(youtubeOffsetTime - youtubeProgressTime)
        if (diff < 0) return null
        return (
            <div className="bg-yellow-400 p-1 rounded-md text-black absolute z-10 top-2 right-2">
                Answer in: {humanizeTime(diff)}
            </div>
        )
    }

    const renderYoutubeEmbedding = () => {
        const linkId = stripExtension(answer.meta.name)
        const opts = {
            height: '200px',
            width: '100%',
            playerVars: {
                start: youtubeAnswerStartTime, // begin playing the video at the given number of seconds from the start of the video
            },
        };
        if (youtubeOffsetTime == -1 || youtubeEmbeddingLoading) {
            return (
                <div className="flex items-center justify-center bg-white" style={{height: "200px", width: "100%"}}>
                    <Spin tip="loading video..."/>
                </div>
            )
        }
        return (
            <div className="w-full relative">
                {renderAnswerCountDown()}
                <YouTube
                    containerClassName={"w-full"}
                    onReady={(e) => {
                        setYoutubePlayer(e.target)
                    }}
                    videoId={linkId}                  // defaults -> null
                    opts={opts}
                />
            </div>
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
                <span className="p-2 ml-1 mr-1 text-black rounded-md "
                      style={{backgroundColor: "#FBBF24", borderColor: "#047857"}}>
                    {answerText}
                    </span>
                {contextAfter}
                <span className="ml-2">[...]</span>
            </div>
            {isYoutubeDocument && renderYoutubeEmbedding()}
            <div className="flex justify-between gap-2">
                {isYoutubeDocument &&
                <Button className="mt-2" style={{display: "flex", alignItems: "center"}} onClick={handleRewindYoutube}
                        icon={<SyncOutlined/>}> Rewind clip to answer </Button>}
                <Button className="mt-2" style={{display: "flex", alignItems: "center"}} onClick={onShowResultsList}
                        icon={<CaretDownOutlined/>}> View more answers</Button>
            </div>
        </div>
    )
}