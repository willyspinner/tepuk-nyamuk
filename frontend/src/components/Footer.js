import React from 'react';
import {Icon } from 'antd';
const Footer = (props)=>{
    return (
        <footer>
            <p style={{color: "#acadaf"}}>
                © Made by Wilson Jusuf, 2018. &nbsp;
               <a href={"https://www.github.com/willyspinner/tepuk-nyamuk"}>
                   <Icon type="github"/>
               </a>
            </p>
        </footer>
    );
}

export default Footer;