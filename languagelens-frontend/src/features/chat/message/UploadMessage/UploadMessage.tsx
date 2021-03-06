import React from "react";
import Message from "../Message";
import { Upload, message } from 'antd';
import {Message as MessageType} from "../../room/roomSlice";
import {InboxOutlined} from "@ant-design/icons";
import {BASE_URL, UPLOAD_PATH} from "../../../../constants";
import {UploadChangeParam} from "antd/lib/upload";
import {useAppDispatch} from "../../../../app/hooks";
import {getDocuments} from "../../../document/documentSlice";

const { Dragger } = Upload;

type UploadMessageProps = {
   msg: MessageType
}
export const UploadMessage = ({msg}: UploadMessageProps) => {
    const dispatch = useAppDispatch()
    const onUploadStatusChange = (info: UploadChangeParam) => {
        const { status } = info.file;
        if (status !== 'uploading') {
            console.log(info.file, info.fileList);
        }
        if (status === 'done') {
            message.success(`${info.file.name} file upload successful.`);
            dispatch(getDocuments())
        } else if (status === 'error') {
            message.error(`${info.file.name} file upload failed.`);
        }
    }
    return (
        <Message className="ml-2 mr-2" key={msg.time} delivered sender={msg.sender}>
            <span className="pb-10">Here, upload your PDF or TXT files by dragging them onto the box below:</span>
            <Dragger
                multiple={true}
                onChange={onUploadStatusChange}
                style={{padding: "1rem", marginTop: "0.5rem"}}
                name="files"
                action={BASE_URL + UPLOAD_PATH}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                    Only supports PDF and TXT files!
                </p>
            </Dragger>
        </Message>
    )
};