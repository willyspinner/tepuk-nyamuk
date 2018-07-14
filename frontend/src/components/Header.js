import React from 'react';

import {connect} from 'react-redux';

class Header extends React.Component {
    state = {
        current: 'mail',
    }

    handleClick = (e) => {
        console.log('click ', e);
        this.setState({
            current: e.key,
        });
    }

    render() {
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
                        <img src="/fly-image-white.png"
                             height="35px"
                             width="35px"
                             style={{marginLeft: '10px',marginRight: '10px', marginTop: '5px'}}
                        />
                        <h1 style={{color: '#ffffff'}} className="main_header"> Tepuk  </h1>
                        <h1 style={{marginLeft: '15px',color: '#ffffff'}} className="main_header"> Nyamuk </h1>
                    </div>
                    <div style={{marginTop:"5px", marginRight: '10px'}}>
                        {this.props.username ?
                            (<h3 style={{color: '#ffffff'}}>{this.props.username}</h3>)
                            :null
                        }
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    username: state.user.username,
});

export default connect(mapStateToProps)(Header);
