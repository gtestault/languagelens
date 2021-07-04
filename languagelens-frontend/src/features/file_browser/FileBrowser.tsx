import React, {useEffect, useRef} from "react";
import clsx from "clsx";
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {getDocuments, selectDocuments, selectHighlightedDocument} from "../document/documentSlice";
import {AnimatePresence, AnimateSharedLayout, motion} from "framer-motion";
import pdfLogo from "../../assets/logo/file-pdf-gray.svg"
import textLogo from "../../assets/logo/file-alt-gray.svg"
import {Tooltip} from "antd";

type FileBrowserProps = {
    className?: string
}
export const FileBrowser = (props: FileBrowserProps) => {
    const dispatch = useAppDispatch()
    const documents = useAppSelector(selectDocuments)
    const wrapperClasses = clsx("overflow-y-auto overflow-x-hidden flex flex-col items-center p-5 rounded-md font-semibold", documents && "bg-gray-700 ring-4 ring-gray-700")
    const wrapperStyles = {width: "20em", height: "80vh"}
    useEffect(() => {
        dispatch(getDocuments())
    }, [])
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
    const highlightedDoc = useAppSelector(selectHighlightedDocument)
    const refs = useRef(new Map<string, HTMLDivElement | null>())
    useEffect(() => {
        if (highlightedDoc === "") {
            return
        }
        const el = refs.current.get(highlightedDoc)
        if (!el) {
            return
        }
        el.scrollIntoView({behavior: "smooth"})
    }, [highlightedDoc])
    const renderDocuments = () => {
        const getLogo = (doc: string): string => (
            doc.endsWith(".pdf") ? pdfLogo : textLogo
        )
        return documents.map(doc => {
                return (
                    <AnimateSharedLayout key={doc}>
                        <AnimatePresence>
                            <motion.div
                                ref={el => refs.current.set(doc, el)}
                                layout
                                initial={{y: 50, opacity: 0}}
                                animate={{y: 0, opacity: 1}}
                                transition={{duration: 0.5}}
                                key={doc}
                                className={clsx(
                                    "flex flex-col items-center justify-start bg-white text-gray-700 rounded-md h-40 p-5 text-center truncate transition-colors",
                                    (doc === highlightedDoc) && "bg-yellow-300"
                                )}>
                                <Tooltip title={doc}>
                                    <span className="w-40 truncate">{doc}</span>
                                </Tooltip>
                                <img className="w-10 flex-1" src={getLogo(doc)} alt="file-type-logo"/>
                            </motion.div>
                        </AnimatePresence>
                    </AnimateSharedLayout>
                )
            }
        )
    }
    return (
        <div className={clsx(className, "mt-1 grid grid-cols-files gap-4 auto-rows-min")}>
            {renderDocuments()}
        </div>
    )
}