import React from 'react';
import {Input,Button,Icon} from 'antd';
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
        <div style={{display:'flex',flexDirection:'column', }}>
        <h2
            style={{marginTop: "10px",color:'white',textAlign:'center'}}
        >
            Welcome.
        </h2>
            <img src="/fly-image-white.png"
                 style={{alignSelf:'center', marginBottom: '15px'}}
            width="75px"
                 height="75px"
            />

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
            ghost
            style={{marginTop:"4px", marginBottom: "12px"}}
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
