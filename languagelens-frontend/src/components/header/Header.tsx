import React from "react"
import {Typography} from "antd";
import clsx from "clsx";
import telescope from "../../assets/logo/microscope.svg"
import {useAppSelector} from "../../app/hooks";
import {selectIsQuestionAnsweringMode} from "../../features/chat/room/roomSlice";
import {AnimatePresence, AnimateSharedLayout, motion} from "framer-motion";

const {Title} = Typography
type HeaderProps = {
    className?: string
}
const Header = (props: HeaderProps) => {
    const isQuestionAnsweringMode = useAppSelector(selectIsQuestionAnsweringMode)
    return (
        <div className={clsx(props.className, "flex flex-row items-center gap-4")}>
            <AnimateSharedLayout>
                {!isQuestionAnsweringMode && (
                    <motion.img layout key="microscope" className="w-8 text-gray-700" src={telescope} alt="telescope-logo"/>
                )}
                <motion.h1 layout className="text-gray-700 text-4xl font-semibold mb-0">Language Lens</motion.h1>

                {isQuestionAnsweringMode && (
                    <motion.img layout key="microscope" className="w-8 text-gray-700" src={telescope} alt="telescope-logo"/>
                )}
                <AnimatePresence>
                    {isQuestionAnsweringMode && (
                        <motion.h1 layout
                                   initial={{x: 100}}
                                   animate={{x: 0}}
                                   transition={{type: "spring", duration: 1}}
                                   className="text-green-700 text-4xl font-semibold mb-0">
                            Question Mode
                        </motion.h1>
                    )}
                </AnimatePresence>
            </AnimateSharedLayout>
        </div>
    )
}
export default Header