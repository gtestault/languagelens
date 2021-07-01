import React, {useEffect} from "react";
import clsx from "clsx";
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {getDocuments, selectDocuments} from "../document/documentSlice";
import {AnimatePresence, motion} from "framer-motion";
import pdfLogo from "../../assets/logo/file-pdf-gray.svg"
import textLogo from "../../assets/logo/file-alt-gray.svg"

type FileBrowserProps = {
    className?: string
}
export const FileBrowser = (props: FileBrowserProps) => {
    const dispatch = useAppDispatch()
    const documents = useAppSelector(selectDocuments)
    const wrapperClasses = clsx("flex flex-col items-center p-5 rounded-md font-semibold", documents && "bg-gray-700")
    const wrapperStyles = {width: "20em", height: "80vh"}
    useEffect(() => {
        dispatch(getDocuments())
    }, [documents])
    if (!documents) {
        return (
            <div style={wrapperStyles} className={clsx(props.className, wrapperClasses)}/>
        )
    }
    return (
        <div style={wrapperStyles} className={clsx(props.className, wrapperClasses)}>
            {
                documents && (
                    <h1 className="text-white text-xl">Your documents</h1>
                )
            }
            <FileGrid className="flex-1" documents={documents}/>
        </div>
    )
};

type FileGridProps = {
    documents: string[]
    className?: string
}
const FileGrid = ({documents, className}: FileGridProps) => {
    const renderDocuments = () => {
        const getLogo = (doc: string): string => (
            doc.endsWith(".pdf") ? pdfLogo : textLogo
        )
        return documents.map(doc => {
                return (
                    <AnimatePresence>
                        <motion.div
                            initial={{y: 50, opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            transition={{duration: 0.5}}
                            key={doc}
                            className="flex flex-col items-center justify-start bg-white rounded-md text-gray-700 h-40 p-5 text-center truncate">
                            <span>{doc}</span>
                            <img className="w-10 flex-1" src={getLogo(doc)} alt="file-type-logo"/>
                        </motion.div>
                    </AnimatePresence>
                )
            }
        )
    }
    return (
        <div className={clsx(className, "overflow-y-scroll mt-1 grid grid-cols-files gap-4 auto-rows-min")}>
            {renderDocuments()}
        </div>
    )
}