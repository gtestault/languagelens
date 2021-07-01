import React from "react";
import {AnimatePresence, motion} from "framer-motion"
import {Avatar, Button} from "antd";
import {ReactComponent as QuestionLogo} from "../../../../assets/logo/question_white.svg"
import {ReactComponent as FileSearchLogo} from "../../../../assets/logo/file-search.svg"
import {ReactComponent as HighlightLogo} from "../../../../assets/logo/highlighter.svg"
import Icon from "@ant-design/icons";

type QuestionModeOnboardingProps = {
    onFinished: () => void
}
export const QuestionModeOnboarding = ({onFinished}: QuestionModeOnboardingProps) => {
    return (
        <AnimatePresence>
            <motion.div className="flex flex-col items-center justify-between pt-5 pb-5 h-full w-full bg-green-700"
                        initial={{opacity: 0}} animate={{opacity: 1}}>
                <h2 className="text-white text-2xl font-semibold mb-0">What is Question Mode?</h2>
                <div className="flex flex-col items-center flex-1 p-5 pt-10 w-full gap-10 pl-10">
                    <div className="flex flex-col mt-5 gap-10">
                        <FeatureDescription logoSrc={QuestionLogo} description="Ask questions in natural language."/>
                        <FeatureDescription logoSrc={FileSearchLogo}
                                            description="AI searches for an answer in your documents."/>
                        <FeatureDescription logoSrc={HighlightLogo}
                                            description="Possible answers get highlighted."/>
                    </div>
                </div>
                <Button onClick={onFinished}>Understood, let me in!</Button>
            </motion.div>
        </AnimatePresence>
    )
};

type FeatureDescriptionProps = {
    logoSrc: any
    description: string
}
const FeatureDescription = ({logoSrc, description}: FeatureDescriptionProps) => {
    return (
        <div className="flex flex-row items-center justify-start w-full gap-10">

            <Avatar style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#064E3B",
                border: "2px solid white"
            }}
                    size={64}
                    icon={<Icon component={logoSrc}/>}/>
            <p className="text-center text-white text-lg font-semibold m-0">{description}</p>
        </div>
    )
}