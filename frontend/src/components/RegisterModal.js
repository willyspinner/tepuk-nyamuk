import React from 'react';
import {Input,Button} from 'antd';
import Modal from 'react-modal';
import IMGTYPES from '../constants/imgTypes';
/*

props:


 */
const registerModal = (props)=>(
    <Modal
        contentLabel="Welcome"
        isOpen={props.isOpen}
        className="mainPage__registerModal"
        ariaHideApp={false}
    >
        <div style={{display:'flex',flexDirection:'column', }}>
        <h1
            style={{marginTop: "20px",color:'white',textAlign:'center'}}
        >
            Welcome.
        </h1>
            <img src={IMGTYPES.flyImage.white}
                 style={{alignSelf:'center', marginBottom: '15px'}}
            width="75px"
                 height="75px"
            />

        <Input size="large"
               placeholder="name"
               value={props.inputUsernameValue}
               onPressEnter={props.onPressEnter}
               style={{marginBottom: "6px"}}
               onChange={(e) => {
                   props.onInputUsernameChange(e);
               }}
        />
        <Input size="large"
               placeholder="password"
               type={"password"}
               value={props.inputPasswordValue}
               style={{marginBottom: "6px"}}
               onPressEnter={props.onPressEnter}
               onChange={(e) => {
                   props.onInputPasswordChange(e);
               }}
        />
        {props.isLoggingIn ?
            null :
            <Input size="large"
                   placeholder="repeat password"
                   type={"password"}
                   value={props.inputRepeatPasswordValue}
                   style={{marginBottom: "6px"}}
                   onPressEnter={props.onPressEnter}
                   onChange={(e) => {
                       props.onInputRepeatPasswordChange(e);
                   }}
            />
        }
        <Button
            type="primary"
            style={{marginBottom:"6px"}}
            onClick={props.onPressEnter}
        >
            {props.isLoggingIn ? "login" : "register"}
        </Button>

        <Button
            ghost
            style={{ marginBottom: "24px"}}
            onClick={props.onTypeChange}
        >
            {props.isLoggingIn ?
                    "Need to register?"
                :
                "Already registered?!"
            }
        </Button>
        </div>
    </Modal>
);

export default registerModal;
