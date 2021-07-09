import React from "react";
import clsx from "clsx";
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {
    selectAnswersListQueryResponse,
    selectAnswersListQueryTime,
    selectIsResultsListVisible
} from "./answersListSlice";
import {QueryAnswer} from "../document/documentAPI";
import {AnimatePresence, motion} from "framer-motion";
import {Progress} from "antd";
import {Document, selectDocumentsByName} from "../document/documentSlice";
import {youtubeDocNameToYoutubeLink} from "../../utils/youtube";
import {selectMessages, setQuestionResponseSelectedAnswer} from "../chat/room/roomSlice";

type AnswersListProps = {
    className?: string
}
export const AnswersList = (props: AnswersListProps) => {
    const isVisible = useAppSelector(selectIsResultsListVisible)
    const queryResponse = useAppSelector(selectAnswersListQueryResponse)
    const queryTime = useAppSelector(selectAnswersListQueryTime)
    const documents = useAppSelector(selectDocumentsByName)
    const messages = useAppSelector(selectMessages)
    const dispatch = useAppDispatch()
    const wrapperClasses = clsx("overflow-y-auto overflow-x-hidden flex flex-col gap-5 items-center p-5 rounded-md font-semibold", isVisible && "bg-gray-700 ring-4 ring-gray-700")
    const wrapperStyles = {width: "20em", height: "80vh"}
    const message = messages.find(m => m.time === queryTime)
    const selectedMessageIndex = message?.custom.queryResponse.selectedAnswer
    if (!isVisible || !queryResponse || !queryResponse.answers) {
        return (
            <div style={wrapperStyles} className={clsx(props.className, wrapperClasses)}/>
        )
    }
    const handleAnswerClick = (i: number) => {
        dispatch(setQuestionResponseSelectedAnswer({time: queryTime, index: i}))
    }
    return (
        <div style={wrapperStyles} className={clsx(props.className, wrapperClasses)}>
            <h1 className="text-white text-xl">{queryResponse.query}</h1>
            {queryResponse.answers.map((a, i) => {
                return (
                    <ShortAnswerCard highlight={i === selectedMessageIndex} onClick={() => {
                        handleAnswerClick(i)
                    }} doc={documents[a.meta.name]} key={a.score} answer={a}/>
                )
            })}
        </div>
    )
};

type ShortAnswerCardProps = {
    answer: QueryAnswer
    doc: Document
    highlight: boolean
    onClick: () => void
}
export const ShortAnswerCard = ({answer, doc, highlight, onClick}: ShortAnswerCardProps) => {
    const dispatch = useAppDispatch()
    const prob = Math.round(answer.probability * 100)
    const contextBefore = answer.context.slice(0, answer.offset_start)
    const answerText = answer.context.slice(answer.offset_start, answer.offset_end + 1)
    const contextAfter = answer.context.slice(answer.offset_end + 1, -1)
    const title = doc.type === "YOUTUBE" ? youtubeDocNameToYoutubeLink(answer.meta.name) : answer.meta.name
    return (
        <AnimatePresence>
            <motion.div
                onClick={onClick}
                initial={{y: 50, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{duration: 0.5}}
                whileHover={{borderColor: "black"}}
                className={clsx(
                    "flex flex-col items-center gap-1 bg-white text-gray-700 rounded-md cursor-pointer w-full p-5 text-center transition-colors",
                    highlight && "ring-4 ring-yellow-400"
                )}>
                <h1 className="text-lg">{title}</h1>
                <div className="flex flex flex-1 gap-5">
                    <div className="text-left">
                        <span className="mr-2">[...]</span>
                        {contextBefore}
                        <span className="bg-yellow-400 rounded-md p-1 ml-1 mr-1">{answerText}</span>
                        {contextAfter}
                        <span className="ml-2">[...]</span>
                    </div>
                    <div>
                        <Progress type="circle" percent={prob} width={60}/>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}