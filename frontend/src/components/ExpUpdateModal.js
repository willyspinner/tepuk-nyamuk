import React from 'react';
import {Button, Icon} from 'antd';
import Modal from 'react-modal';
import Typed from 'react-typed';
class ExpUpdateModal extends React.Component {
state= {
    typeSpeed: 100
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
                <div style={{display: 'flex', flexDirection: 'column',}}>
                    <h1
                        style={{marginTop: "20px", color: 'white', textAlign: 'center'}}
                    >
                        You earned some exp {hasLeveledUp ? "and leveled up!" : ""}!
                    </h1>

                    {hasLeveledUp ?
                        (
                            <div>
                                <p className="game_font" style={{
                                    fontSize: '35px', textAlign: 'center'
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
                            </div>
                        ) : null
                    }
                    <h1 style={{color: 'white', textAlign: 'center'}}>
                        Exp boost
                    </h1>
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
                    <h1 style={{color: 'white', textAlign: 'center'}}>
                        Remaining till next level (lvl. {this.props.currentLevelIdx + 2}):
                    </h1>
                    <p className="game_font" style={{fontSize: '30px', textAlign: 'center'}}
                    >
                        <Typed
                            strings={[
                                `${this.props.currentLevelObj.threshold - this.props.currentExp} EXP Points.`
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