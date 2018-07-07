import React from 'react';
import {connect} from 'react-redux';
import {Button ,Icon}from 'antd';
import Modal from 'react-modal';
const GameplayResultsModal  = (props)=>{
    return (
        <Modal
            contentLabel={"Game results"}
            isOpen={props.isOpen}
            onRequestClose={()=>{/* cannot close. */}}
            ariaHideApp={false}
        >
      <h1> Game results</h1>
        <h3> {props.gameplay.winner} WON THE GAME!</h3>
            <Button onClick={()=>alert("not implemented yet")}>
               <Icon type="home" style={{fontSize:30}}/>
                Go back to home page.
            </Button>
        </Modal>
    );
};

const mapStateToProps = (state) => ({
    gameplay: state.gameplay,
    myusername: state.user.username
});
export default connect(mapStateToProps)(GameplayResultsModal);