import React, {CSSProperties, useEffect, useMemo} from "react"
import clsx from "clsx";
import {Avatar} from "antd";
import botImg from "../../../assets/pictures/robot.png"
import {selectIsQuestionAnsweringMode, SENDER} from "../room/roomSlice";
import {AnimatePresence, motion} from "framer-motion"
import {useAppSelector} from "../../../app/hooks";

type MessageProps = {
    children: React.ReactNode
    delivered: boolean,
    className?: string,
    messageBubbleStyle?: CSSProperties
    sender: SENDER,
}
const Message = ({children, delivered, sender, className, messageBubbleStyle}: MessageProps) => {
    const isQuestionAnsweringMode = useAppSelector(selectIsQuestionAnsweringMode)
    const messageStyle = useMemo(() => {
        if (sender === SENDER.SENDER_USER) {
            return "rounded-bl-lg self-end"
        } else {
            return "rounded-br-lg self-start"
        }
    }, [sender])
    const renderBotAvatar = () => {
        if (sender !== SENDER.SENDER_BOT) {
            return null
        }
        const botBackgroundColor = isQuestionAnsweringMode ? "#f6ffed" : "#BFDBFE"
        return (
            <Avatar style={{border: "2px solid #374151", backgroundColor: botBackgroundColor, transitionProperty: "background-color", transitionDuration: "1s"}} shape="circle" size="default"
                    src={botImg}/>
        )
    }
    const renderUserAvatar = () => {
        if (sender !== SENDER.SENDER_USER) {
            return null
        }
        return <Avatar style={{backgroundColor: "#374151"}} shape="circle" size="default">You</Avatar>
    }
    const translationAnimation = sender == SENDER.SENDER_USER ? "10em" : "-10em"
    return (
        <AnimatePresence>
            <motion.div initial={{translateX: translationAnimation}}
                        animate={{translateX: 0}}
                        exit={{opacity:0}}
                        transition={{duration: 1, type: "spring"}}
                        className={clsx("flex flex-row items-end gap-1", messageStyle, className)}
            >
                {renderBotAvatar()}
                <div style={{maxWidth: "20em", overflowWrap: "break-word", ...messageBubbleStyle}}
                     className={clsx("bg-blue-500 text-white rounded-t-lg p-1.5", messageStyle)}>
                    {children}
                </div>
                {renderUserAvatar()}
            </motion.div>
        </AnimatePresence>
    )
}
export default Message