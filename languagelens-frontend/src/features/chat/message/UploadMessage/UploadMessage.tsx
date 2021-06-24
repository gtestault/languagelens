import React from "react";
import Message from "../Message";
import { Upload, message } from 'antd';
import {Message as MessageType} from "../../room/roomSlice";
import {InboxOutlined} from "@ant-design/icons";

const { Dragger } = Upload;

type UploadMessageProps = {
   msg: MessageType
}
export const UploadMessage = ({msg}: UploadMessageProps) => {
    return (
        <Message className="ml-2 mr-2" key={msg.time} delivered sender={msg.sender}>
            <span className="pb-10">Here, upload your PDFs by dragging them onto the box below:</span>
            <Dragger style={{padding: "1rem", marginTop: "0.5rem"}}name="file">
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                    Only supports PDF!
                </p>
            </Dragger>
        </Message>
    )
};