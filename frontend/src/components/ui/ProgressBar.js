/*
NOTE: adapted from https://codepen.io/DZuz14/pen/oqeMpY

 */
import React from 'react';
const Filler = (props) => {
    if (props.fillerClassName)
        return <div className={props.fillerClassName}  style={{ width: `${props.percentage}%` , background: props.color}} />
    else
    return <div className={`filler ${props.isFlashing?"animated infinite flash": ""} `}  style={{ width: `${props.percentage}%` , background: props.color}} />
}
const ProgressBar = (props) => {
    return (
        <div className={`progress-bar`} style={{width: props.width, height : props.height, border: `2px solid ${props.borderColor? props.borderColor:"#333"}`}}>
            <Filler
                percentage={props.percentage}
                color={props.color}
                isFlashing={props.isFlashing}
                fillerClassName={props.fillerClassName}
           />
        </div>
    )
}
/* props to pass in
height: (CSS height)
width; (CSS width)
fillerClassName
color: (CSS background)
percentage: (0 to 100)
isFlashing: boolean (filler flashes or not)
 */

export default ProgressBar;

