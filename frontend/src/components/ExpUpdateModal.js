import React from 'react';
import {Button, Icon} from 'antd';
import Modal from 'react-modal';
import Typed from 'react-typed';
import IMGTYPES from '../constants/imgTypes';
import ExpUpdateProgressBar from "./ExpUpdateProgressBar";
import AnimatedNumber from 'react-animated-number'
class ExpUpdateModal extends React.Component {

state= {
    showTick: false,
    typeSpeed: 50,
    initialDelayMs: 1000,
    tickMs: 20 , // per tickMs, update the progressBar.
    pgbarExpInterval: 20, // per tickMs, increment Exp by pgbarExpInterval
    levelingUpMs: 1000, // delay time when leveling up so we can do effects (e.g. level bar flashing)
    percentageInterval: 2,
}
componentDidMount(){
    let timeout = setTimeout(()=>{
        this.setState({showTick:true});
        clearTimeout(timeout);
    },this.state.initialDelayMs);
}


    render() {
        /* calculate time for exp score. */
        let expTimeMs = 3000;
        // if NOT advancing initially already at max level
       if( this.props.currentLevelObj.threshold ||this.props.currentLevelIdx !== this.props.previousLevelIdx)
           expTimeMs = this.state.initialDelayMs;
           switch(this.props.currentLevelIdx - this.props.previousLevelIdx){
               case 0:
                   // progress bar movement time (no change of levels)
                   expTimeMs += (((this.props.currentExp - this.props.previousExp ) / this.state.pgbarExpInterval) * this.state.tickMs)
                   break;
               case 1:
                   // progress bar to end of previous level.
                   expTimeMs += (((this.props.previousLevelObj.threshold- this.props.previousExp ) / this.state.pgbarExpInterval) * this.state.tickMs)
                   // level up
                   expTimeMs += this.state.levelingUpMs;
                   //  progress bar to end of current progress.
                   expTimeMs += (((this.props.currentExp - this.props.currentLevelObj.start ) / this.state.pgbarExpInterval) * this.state.tickMs)
                   break;
               default:
                   // progress bar to end of previous level.
                   expTimeMs += (((this.props.previousLevelObj.threshold- this.props.previousExp ) / this.state.pgbarExpInterval) * this.state.tickMs)
                   // between levels percentages.
                   expTimeMs += (this.props.currentLevelIdx - this.props.previousLevelIdx  ) * (this.state.levelingUpMs+ ((100 / this.state.percentageInterval) * this.state.tickMs))
                       // till the end. If not at max level, then add
                   if( this.props.currentLevelObj.threshold){
                       expTimeMs += (((this.props.currentExp - this.props.currentLevelObj.start ) / this.state.pgbarExpInterval) * this.state.tickMs)
                   }



       }
        const hasLeveledUp = this.props.previousLevelIdx < this.props.currentLevelIdx;
        return (
            <Modal
                contentLabel="Exp Gains"
                isOpen={this.props.isOpen}
                className="mainPage__expUpdateModal"
                ariaHideApp={false}
                onRequestClose={this.props.onRequestClose}
            >
                {this.props.isOpen ?(
                <div style={{display: 'flex', flexDirection: 'column', overflow:'auto'}}>
                    <h1
                        style={{marginTop: "20px",  textAlign: 'center'}}
                    >
                        You earned some exp {hasLeveledUp ? "and leveled up!" : ""}!
                    </h1>

                    <img
                    src={IMGTYPES.expUpdate.stairsGoal}
                    height={130}
                    width={130}
                    style={{alignSelf:'center'}}
                    />
                    <AnimatedNumber
                        component="text"
                        initialValue={this.props.previousExp}
                        value={this.state.showTick? this.props.currentExp: this.props.previousExp}
                        className="game_font"
                        style={{
                            transition: '0.8s ease-out',
                            fontSize: 40,
                            transitionProperty: 'background-color, color, opacity',
                            alignSelf:'center',

                        }}
                        duration={expTimeMs}
                        formatValue={n => `${n} ${n != this.props.currentExp? `+ ${this.props.currentExp - n}`:''} EXP `}
                        stepPrecision={0}
                    />
                    <ExpUpdateProgressBar
                        expFrom={this.props.previousExp}
                        levelFromIdx={this.props.previousLevelIdx}
                        levelFromStart={this.props.previousLevelObj.start}
                        levelFromThreshold={this.props.previousLevelObj.threshold}

                        expTo={this.props.currentExp}
                        levelToIdx={this.props.currentLevelIdx}
                        levelToThreshold={this.props.currentLevelObj.threshold}
                        levelToStart={this.props.currentLevelObj.start}
                        percentageInterval={this.state.percentageInterval}

                        {...this.state /* this is for the Ms stuff */}

                        style={{marginBottom: '15px'}}
                    />
                    {this.props.currentLevelObj.threshold ?
                        <p className="game_font" style={{fontSize: '15px', textAlign: 'center'}}
                        >
                            <Typed
                                strings={[
                                    `Remaining till Lvl. ${this.props.currentLevelIdx + 2} :${this.props.currentLevelObj.threshold - this.props.currentExp} EXP Points.`
                                ]}
                                typeSpeed={this.state.typeSpeed}
                                typedRef={(el) => {
                                    this.el4 = el;
                                }}
                            />
                        </p>
                        :undefined}
                    {hasLeveledUp && this.props.currentLevelIdx ?
                        (
                            <div style={{display:'flex',flexDirection:'column'}}>
                                <div style={{alignSelf:'center',display:'flex',flexDirection:'row', alignItems:'center'}}>
                                <img
                                    height={100}
                                    width={100}
                                src={IMGTYPES.levels.white[this.props.previousLevelIdx]}/>
                                    <Icon type="arrow-right" style={{fontSize:'40px',color:'white'}}/>
                                <img


                                    height={100}
                                    width={100}
                                    src={IMGTYPES.levels.white[this.props.currentLevelIdx]}/>
                                </div>
                                <p className="game_font" style={{fontSize: '15px', textAlign: 'center'}}
                                >
                                    <Typed
                                        strings={[
                                            `${this.props.previousLevelObj.levelname } -> ${this.props.currentLevelObj.levelname}`

                                        ]}
                                        typeSpeed={this.state.typeSpeed}
                                        typedRef={(el) => {
                                            this.el2 = el;
                                        }}
                                    />
                                </p>
                            </div>
                        ) : null
                    }
                    <Button
                        onClick={this.props.onRequestClose}
                        type="primary"
                        style={{marginTop: '15px', marginBottom:"38px"}}
                    >
                        Alright!
                        <Icon type="smile-o"/>
                    </Button>


                </div>):null}
            </Modal>
            );

    }
}

export default ExpUpdateModal;