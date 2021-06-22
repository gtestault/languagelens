import React from "react"
import {Typography} from "antd";
import clsx from "clsx";
import telescope from "../../assets/logo/microscope.svg"

const {Title} = Typography
type HeaderProps = {
    className?: string
}
const Header = (props: HeaderProps) => {
    return (
        <div className={clsx(props.className, "flex flex-row items-center gap-4")}>
            <img className="w-8 text-gray-700" src={telescope} alt="telescope-logo"/>
            <h1 className="text-gray-700 text-4xl font-semibold mb-0">Language Lens</h1>
        </div>
    )
}
export default Header