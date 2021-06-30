import React, {useCallback, useEffect, useRef, useState} from "react"
import Message from "../message/Message";
import clsx from "clsx";
import {Button, Input, Spin} from "antd";
import useWebSocket, {ReadyState} from "react-use-websocket";
import {
    addMessage,
    Message as MessageType,
    selectIsBotThinking,
    selectIsQuestionAnsweringMode,
    selectMessages,
    SENDER,
    switchRoomMode
} from "./roomSlice";
import {useAppDispatch, useAppSelector} from "../../../app/hooks";
import {GifMessage} from "../message/GifMessage/GifMessage";
import {UploadMessage} from "../message/UploadMessage/UploadMessage";
import {FileSearchOutlined as QuestionModeIcon, RollbackOutlined as ExitQuestionModeIcon} from "@ant-design/icons";
import {QuestionModeTutorial} from "./question-mode-tutorial/QuestionModeTutorial";

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
        dispatch(addMessage({message: messageBoxInput, sender: SENDER.SENDER_USER, time: new Date().getTime()}))
        sendJsonMessage({message: messageBoxInput})
        setMessageBoxInput("")
    }

    const roomModeButtonText = isQuestionAnsweringMode ? "Exit question mode" : "Enter question mode"
    const roomModeButtonIcon = isQuestionAnsweringMode ? <ExitQuestionModeIcon/> : <QuestionModeIcon/>
    const handleSwitchRoomModeButtonClick = () => {
        dispatch(switchRoomMode())
    }
    const ringStyle = isQuestionAnsweringMode ? "ring-green-700" : "ring-blue-400"
    const renderChatRoomContent = () => {
        if (isQuestionAnsweringMode) {
           return <QuestionModeTutorial onFinished={handleSwitchRoomModeButtonClick}/>
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
        <div className={clsx(props.className, ringStyle, "flex flex-col w-1/3 ring-4 rounded-sm justify-between")}
             style={{height: "80vh", transitionProperty: "box-shadow", transitionDuration: "1s"}}>
            {renderChatRoomContent()}
        </div>
    )
}
export default Room