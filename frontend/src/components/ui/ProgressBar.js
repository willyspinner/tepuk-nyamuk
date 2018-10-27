/*
NOTE: adapted from https://codepen.io/DZuz14/pen/oqeMpY

 */
import React from 'react';
const Filler = (props) => {
    return <div className={`filler ${props.isFlashing?"animated infinite flash": ""} `}  style={{ width: `${props.percentage}%` , background: props.color}} />
}
const ProgressBar = (props) => {
    return (
        <div className={`progress-bar`} style={{width: props.width, height : props.height}}>
            <Filler
                percentage={props.percentage}
                color={props.color}
                isFlashing={props.isFlashing}
           />
        </div>
    )
}
/* props to pass in
height: (CSS height)
width; (CSS width)
color: (CSS background)
percentage: (0 to 100)
isFlashing: boolean (filler flashes or not)
 */

export default ProgressBar;

