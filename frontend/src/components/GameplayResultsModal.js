import React from 'react';
import {connect} from 'react-redux';
import {Button ,Icon}from 'antd';
import Modal from 'react-modal';
import ScoreRankings from "./ui/ScoreRankings";
const GameplayResultsModal  = (props)=>{
    return (
        <Modal
            contentLabel={"Game results"}
            isOpen={props.isOpen}
            onRequestClose={()=>{/* cannot close. */}}
            ariaHideApp={false}
        >
            <div style={{display:'flex',flexDirection:'column',justifyContent:'center'}}>
      <h1> Game results</h1>
        <p style={{fontSize:'30px'}}> {props.gameplay.winner} won the game!</p>
            <Icon type="trophy" style={{fontSize:60}}/>
                <div className="gameplayPage__module">
                <ScoreRankings
                    winner={props.gameplay.winner}
                    finalscores={props.gameplay.finalscores}
                />
                </div>
            <Button onClick={props.onGoBackToHome} style={{marginTop:'15px'}}>
               <Icon type="home" style={{fontSize:30}}/>
                Go to home
            </Button>
            </div>
        </Modal>
    );
};

const mapStateToProps = (state) => ({
    gameplay: state.gameplay,
    myusername: state.user.username
});
export default connect(mapStateToProps)(GameplayResultsModal);