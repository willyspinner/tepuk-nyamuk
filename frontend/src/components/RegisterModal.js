import React from 'react';
import {Input,Button} from 'antd';
import Modal from 'react-modal';

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
        <h2
            style={{marginTop: "20px"}}
        >
            Welcome.
        </h2>

        <Input size="large"
               placeholder="name"
               value={props.inputUsernameValue}
               onPressEnter={props.onPressEnter}
               style={{marginBottom: "4px"}}
               onChange={(e) => {
                   props.onInputUsernameChange(e);
               }}
        />
        <Input size="large"
               placeholder="password"
               type={"password"}
               value={props.inputPasswordValue}
               style={{marginBottom: "4px"}}
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
                   style={{marginBottom: "4px"}}
                   onPressEnter={props.onPressEnter}
                   onChange={(e) => {
                       props.onInputRepeatPasswordChange(e);
                   }}
            />
        }
        <Button
            type="primary"
            style={{marginBottom:"4px", marginTop: "4px"}}
            onClick={props.onPressEnter}
        >
            {props.isLoggingIn ? "login" : "register"}
        </Button>

        <Button
            type="dashed"
            ghost
            style={{marginTop:"4px", marginBottom: "12px"}}
            onClick={props.onTypeChange}
        >
            {props.isLoggingIn ?
                "First time here? Click me!"
                :
                "Already a registered user? Click me!"
            }
        </Button>
    </Modal>
);

export default registerModal;
