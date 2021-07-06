import React from "react";
import Message from "../Message";
import {Message as MessageType, SENDER} from "../../room/roomSlice";
import {useAppDispatch} from "../../../../app/hooks";
import {highlightDocument, removeHighlightDocument} from "../../../document/documentSlice";

type YoutubeMessageProps = {
    msg: MessageType
}
export const YoutubeMessage = ({msg}: YoutubeMessageProps) => {
    const dispatch = useAppDispatch()
    const highlightDoc = () => {dispatch(highlightDocument(msg.custom.link_id + ".txt"))}
    const removeHighlightDoc = () => {dispatch(removeHighlightDocument())}
    return (
        <Message className="ml-2" delivered sender={SENDER.SENDER_BOT}>
            I finished processing your youtube video:
            <iframe
                    onMouseEnter={highlightDoc}
                    onMouseLeave={removeHighlightDoc}
                    className="mt-2"
                    width="100%"
                    src={"https://www.youtube.com/embed/" + msg.custom.link_id}
                    title="YouTube video player" frameBorder="0"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen/>
        </Message>
    )
};