import React, {useCallback, useEffect, useRef, useState} from "react"
import Message from "../message/Message";
import clsx from "clsx";
import {Button, Input, message, Spin} from "antd";
import useWebSocket, {ReadyState} from "react-use-websocket";
import {
    addMessage,
    finishedQuestionAnsweringOnboarding,
    Message as MessageType,
    selectIsBotThinking,
    selectIsQuestionAnsweringMode,
    selectIsQuestionAnsweringOnboardingActive,
    selectMessages,
    SENDER,
    setBotThinking,
    switchRoomMode
} from "./roomSlice";
import {useAppDispatch, useAppSelector} from "../../../app/hooks";
import {GifMessage} from "../message/GifMessage/GifMessage";
import {UploadMessage} from "../message/UploadMessage/UploadMessage";
import {FileSearchOutlined as QuestionModeIcon, RollbackOutlined as ExitQuestionModeIcon} from "@ant-design/icons";
import {QuestionModeOnboarding} from "./question-mode-onboarding/QuestionModeOnboarding";
import {QuestionMessage} from "../message/QuestionMessage/QuestionMessage";
import {postDocumentQuery} from "../../document/querySlice";
import {unwrapResult} from "@reduxjs/toolkit";
import {QuestionResponseMessage} from "../message/QuestionResponseMessage/QuestionResponseMessage";
import {GreenMessage} from "../message/GreenMessage/GreenMessage";

type RoomProps = {
    className?: string
}
const Room = (props: RoomProps) => {
    const chatBoxRef: null | React.RefObject<HTMLElement> = useRef(null);
    const [messageBoxInput, setMessageBoxInput] = useState("")
    const socketUrl = "ws://127.0.0.1:5034/ws"
    const messages = useAppSelector(selectMessages)
    const isBotThinking = useAppSelector(selectIsBotThinking)
    const isQuestionAnsweringMode = useAppSelector(selectIsQuestionAnsweringMode)
    const isQuestionAnsweringOnboardingActive = useAppSelector(selectIsQuestionAnsweringOnboardingActive)
    const dispatch = useAppDispatch()
    const {
        sendMessage,
        sendJsonMessage,
        lastMessage,
        readyState,
    } = useWebSocket(socketUrl);
    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    const scrollToBottomOfChat = useCallback(() => {
        if (!chatBoxRef || !chatBoxRef.current) return
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }, [chatBoxRef])

    useEffect(() => {
        scrollToBottomOfChat()
    }, [messages, scrollToBottomOfChat])

    useEffect(() => {
        if (!lastMessage || !lastMessage.data) {
            return
        }
        const message: MessageType = JSON.parse(lastMessage.data)
        message.time = new Date().getTime()
        dispatch(addMessage(message))
    }, [lastMessage])

    const renderMessages = () => {
        return messages.map(msg => {
            if (msg.custom) {
                switch (msg.custom.type) {
                    case "gif":
                        return <GifMessage handleGifLoaded={scrollToBottomOfChat} key={msg.time} msg={msg}/>
                    case "upload":
                        return <UploadMessage key={msg.time} msg={msg}/>
                    case "green":
                        return <GreenMessage key={msg.time} msg={msg}/>
                    case "question":
                        return <QuestionMessage key={msg.time} msg={msg}/>
                    case "question_response":
                        return <QuestionResponseMessage key={msg.time} msg={msg} queryResponse={msg.custom.queryResponse}/>
                }
            }
            return <Message className="ml-2 mr-2" key={msg.time} delivered sender={msg.sender}>{msg.message}</Message>
        })
    }

    const renderThinkingIndicator = () => {
        return isBotThinking && (
            <Spin className="mt-20" tip="thinking"/>
        )
    }
    const handleInputPressEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") {
            return
        }
        setMessageBoxInput("")
        if (isQuestionAnsweringMode) {
            sendMessageToQuestionAnsweringPipeline()
        } else {
            sendMessageToConversationalPipeline()
        }
    }
    const sendMessageToQuestionAnsweringPipeline = () => {
        dispatch(addMessage({
            message: messageBoxInput,
            sender: SENDER.SENDER_USER,
            time: new Date().getTime(),
            custom: {type: "question"}
        }))
        dispatch(postDocumentQuery({query: messageBoxInput, top_k_reader: 5, top_k_retriever: 5}))
            .then(unwrapResult)
            .then((res) => {
                if (!res.answers) {
                    return
                }
                dispatch(addMessage({
                    sender: SENDER.SENDER_BOT,
                    time: new Date().getTime(),
                    message: "",
                    custom: {type: "question_response", queryResponse: res}
                }))
            })
            .catch(e => {
                message.error("Failed to send question")
                dispatch(setBotThinking(false))
            })
        dispatch(setBotThinking(true))
    }
    const sendMessageToConversationalPipeline = () => {
        dispatch(addMessage({message: messageBoxInput, sender: SENDER.SENDER_USER, time: new Date().getTime()}))
        dispatch(setBotThinking(true))
        sendJsonMessage({message: messageBoxInput})
    }

    const roomModeButtonText = isQuestionAnsweringMode ? "Exit question mode" : "Enter question mode"
    const roomModeButtonIcon = isQuestionAnsweringMode ? <ExitQuestionModeIcon/> : <QuestionModeIcon/>
    const handleSwitchRoomModeButtonClick = () => {
        if (!isQuestionAnsweringMode) {
            dispatch(addMessage({
                message: "We are now in the question answering mode. In this mode, I will only answer questions related to your documents.",
                time: new Date().getTime(),
                sender: SENDER.SENDER_BOT,
                custom: {type: "green"}
            }))
        } else {
           dispatch(addMessage({
               message: "We are back in conversation mode!",
               time: new Date().getTime(),
               sender: SENDER.SENDER_BOT,
           }))
        }
        dispatch(switchRoomMode())
    }
    const handleFinishedQuestionAnsweringOnboarding = () => {
        dispatch(finishedQuestionAnsweringOnboarding())
    }
    const ringStyle = isQuestionAnsweringMode ? "ring-green-700" : "ring-blue-400"
    const questionAnsweringOnboardingStyle = isQuestionAnsweringOnboardingActive && isQuestionAnsweringMode ? "p-0" : "p-2"
    const renderChatRoomContent = () => {
        if (isQuestionAnsweringMode && isQuestionAnsweringOnboardingActive) {
            return <QuestionModeOnboarding onFinished={handleFinishedQuestionAnsweringOnboarding}/>
        }
        return (
            <>
                <section ref={chatBoxRef} style={{overflowX: "hidden"}}
                         className="flex flex-1 mt-2 mb-4 overflow-y-auto gap-1.5 flex-col">
                    {renderMessages()}
                    {renderThinkingIndicator()}
                </section>
                <div className="flex flex-row gap-2">
                    <Button type="default" style={{display: "flex", alignItems: "center"}}
                            icon={roomModeButtonIcon}
                            onClick={handleSwitchRoomModeButtonClick}>{roomModeButtonText}</Button>
                    <Input className="flex-1" value={messageBoxInput}
                           onChange={(e) => setMessageBoxInput(e.target.value)}
                           onKeyDown={handleInputPressEnter}
                           placeholder="Send a message to the Language Lens Bot!"/>
                </div>
            </>
        )
    }
    return (
        <div
            className={clsx(props.className, questionAnsweringOnboardingStyle, ringStyle, "flex flex-col ring-4 rounded-sm justify-between")}
            style={{height: "80vh", transitionProperty: "box-shadow", transitionDuration: "1s"}}>
            {renderChatRoomContent()}
        </div>
    )
}
export default Room