import React from 'react';
import {Button, Icon} from 'antd';
import Modal from 'react-modal';
import Typed from 'react-typed';
import IMGTYPES from '../constants/imgTypes';
class ExpUpdateModal extends React.Component {
state= {
    typeSpeed: 50
}

    render() {
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
                    <p className="game_font" style={{fontSize: '30px', textAlign: 'center'}}
                    >
                        <Typed
                            strings={[

                                `${this.props.previousExp} -> ${this.props.currentExp}`

                            ]}
                            typeSpeed={this.state.typeSpeed}
                            typedRef={(el) => {
                                this.el3 = el;
                            }}
                        />
                    </p>
                    {hasLeveledUp && !isNaN(this.props.currentLevelIdx) ?
                        (
                            <div style={{display:'flex',flexDirection:'column'}}>
                                <p className="game_font" style={{
                                    fontSize: '30px', textAlign: 'center'
                                }}>
                                <Typed
                                    strings={
                                        [`Lv. ${this.props.previousLevelIdx+1 } -> Lv. ${this.props.currentLevelIdx+1 }`,
                                            ]
                                    }
                                    typeSpeed={this.state.typeSpeed}
                                    typedRef={(el) => {
                                        this.el1 = el;
                                    }}
                                />
                                </p>
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
                            </div>
                        ) : null
                    }
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
                    <Button
                        onClick={this.props.onRequestClose}
                        type="primary"
                        style={{margin: '15px'}}
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