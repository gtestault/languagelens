import React from "react"
import Message, {SENDER} from "../message/Message";
import clsx from "clsx";
import {Input} from "antd";

type RoomProps = {
    className?: string
}
const Room = (props: RoomProps) => {
    return (
        <div className={clsx(props.className, "flex flex-col h-full w-1/3 ring-4 rounded-sm ring-blue-400 justify-start")}>
            <section className="flex flex-1 overflow-y-auto flex-col h-full">
                <Message delivered="true" sender={SENDER.SENDER_BOT}>{"hello"}</Message>
                <Message delivered="true" sender={SENDER.SENDER_USER}>{"hello"}</Message>
            </section>
            <Input placeholder="Send a message to the Language Lens Bot!"/>
        </div>
    )
}
export default Room