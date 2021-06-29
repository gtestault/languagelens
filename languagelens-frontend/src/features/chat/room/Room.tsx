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
    SENDER, switchRoomMode
} from "./roomSlice";
import {useAppDispatch, useAppSelector} from "../../../app/hooks";
import {GifMessage} from "../message/GifMessage/GifMessage";
import {UploadMessage} from "../message/UploadMessage/UploadMessage";

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
        if (isBotThinking) {
            return (
                <Spin className="mt-10" tip="thinking"/>
            )
        }
        return null
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
    const handleSwitchRoomModeButtonClick = () => {
        dispatch(switchRoomMode())
    }
    return (
        <div className={clsx(props.className, "flex flex-col w-1/3 ring-4 rounded-sm ring-blue-400 justify-between")}
             style={{height: "80vh"}}>
            <section ref={chatBoxRef} className="flex flex-1 mt-2 mb-4 overflow-y-auto gap-1.5 flex-col">
                {renderMessages()}
                {renderThinkingIndicator()}
            </section>
            <div className="flex flex-row gap-2">
                <Button type="primary" onClick={handleSwitchRoomModeButtonClick}>{roomModeButtonText}</Button>
                <Input className="flex-1" value={messageBoxInput} onChange={(e) => setMessageBoxInput(e.target.value)}
                       onKeyDown={handleInputPressEnter} placeholder="Send a message to the Language Lens Bot!"/>
            </div>
        </div>
    )
}
export default Room