import React from 'react';

import {connect} from 'react-redux';
import {Tooltip} from "antd";
import IMGTYPES from '../constants/imgTypes';

class Header extends React.Component {
    state = {
        current: 'mail',
    }


    render() {

        console.log(`this.props.user: ${JSON.stringify(this.props.user)}`)
        console.log(`condition : ${
        this.props.user &&
        this.props.user.currentLevelIdx >= 0 &&
        this.props.user.currentLevelObj &&
        this.props.user.currentExp >= 0
            
            }`)
        return (
            <div style={{marginBottom: '10px'}} >
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    background: '#4EAFFC',
                    borderBottom: "11px solid #E2E2E2",
                    paddingTop: "9px",
                    justifyContent:'space-between'
                }}>
                    <div style={{display: 'flex', flexDirection: 'row'}}>
                        <img src={IMGTYPES.flyImage.white}
                             height="35px"
                             width="35px"
                             style={{marginLeft: '10px',marginRight: '10px', marginTop: '5px'}}
                        />
                        <h1 style={{color: '#ffffff'}} className="main_header"> Tepuk  </h1>
                        <h1 style={{marginLeft: '15px',color: '#ffffff'}} className="main_header"> Nyamuk </h1>
                    </div>
                    {this.props.user &&
                        this.props.user.currentLevelIdx >= 0 &&
                        this.props.user.currentLevelObj &&
                        this.props.user.currentExp >= 0
                        ? (
                    <div style={{marginTop:"5px", marginRight: '10px' ,display:'flex',flexDirection:'row'}}>
                        <Tooltip
                            placement="bottom"
                            title={`Exp needed to go to level ${this.props.user.currentLevelIdx + 2}: ${this.props.user.currentLevelObj.threshold - this.props.user.currentExp} points.`}
                        >
                            <div style={{display:'flex',flexDirection:'column'}}>
                            <h5 style={{color:'white',
                            }} className="game_font"> Lvl {this.props.user.currentLevelIdx +1} </h5>
                             <h5 style={{color:'white',
                            }} className="game_font">
                                    {this.props.user.currentLevelObj.levelname}
                                </h5>
                                <h5 style={{color:'white',
                                }} className="game_font">
                                    EXP: {this.props.user.currentExp}
                                </h5>

                            </div>
                        </Tooltip>
                            <h1 style={{color: '#ffffff', marginLeft: '20px'}}>{this.props.user.username}</h1>
                    </div>
                        ):null
                    }
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    user: state.user
});

export default connect(mapStateToProps)(Header);
