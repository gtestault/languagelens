import React from "react";
import {AnimatePresence, AnimateSharedLayout, motion} from "framer-motion"
import {Button} from "antd";

type QuestionModeTutorialProps = {
    onFinished: () => void
}
export const QuestionModeTutorial = ({onFinished}: QuestionModeTutorialProps) => {
    return (
        <AnimatePresence>
            <motion.div className="flex flex-col items-center justify-between pt-5 pb-5 h-full w-full bg-green-700" initial={{opacity: 0}} animate={{opacity: 1}} >
                <h2 className="text-white text-2xl font-semibold mb-0">What is Question Mode?</h2>
                <Button onClick={onFinished}>Understood, let me in!</Button>
            </motion.div>
        </AnimatePresence>
    )
};