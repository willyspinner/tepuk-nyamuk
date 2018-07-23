import React, {Component} from 'react';
import {connect} from 'react-redux';
import {List, Button, Icon, Input, Row, Col, Slider, InputNumber} from 'antd';
import AlertDialog from './ui/AlertDialog';
import ReactLoading from 'react-loading';
import EVENTS from '../../../appCentralService/constants/socketEvents';
import {startKickoutUser, startLeaveGame, startRemoveGame, startStartGame} from "../actions/games";
import {startInviteToLobby} from "../actions/user";
import ChatRoom from './ui/ChatRoom';
import {message, Alert} from 'antd';
import {startSendMessage} from "../actions/chatroom";
import IMGTYPES from '../constants/imgTypes';
import LEVELS from '../../../appCentralService/exp/expConfig';

class GameLobbyPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasLeft: false,
            uuid: props.match.params.uuid,
            //NOTEDIFF: I put the same code below in the render method
            // because we had a bug where onUserJoin would be reflected in this local state,
            // but onUserLeave wouldn't hmm.
            // ws connection.
            initgame: this.props.games.filter(g => g.uuid === this.props.match.params.uuid
            )[0],
            isStartingGame: false,
            loadingtypes: ["cubes", "bars", "cylon"],
            loadingidx: 0,
            invitation: {
                invitee: '',
                subject: '',
                message: ''
            },
            error: {
                showErrorModal: false,
                subject: '',
                message: ''
            },
            ncards: 20, // default.
            timelimitmins: 5
        };
        const interval = () => {
            this.setState((prevState) => {
                return {

                    loadingidx: (prevState.loadingidx + 1) % prevState.loadingtypes.length
                };
            })
        };
        this.intervalObj = setInterval(interval,
            3000);

    }

    alertError(subject, message) {
        this.setState({
            error: {
                showErrorModal: true,
                subject,
                message
            }
        })
    }

    componentWillUnmount() {
        console.log(`GAME lobby page componentwill unmount called`)
        clearInterval(this.intervalObj);


        /* if (!this.state.hasLeft)
             this.onLeaveHandler();
         */
    }

    onLeaveHandler = () => {
        console.log(`leaving. Starting game? : ${this.state.isStartingGame}`);
        if (!this.state.isStartingGame) {
            this.props.dispatch(startLeaveGame(this.state.uuid, this.props.user.username))
                .then(() => {
                    if (this.props.user.username === this.state.initgame.creator) {

                        console.log(`dispatching startRemoveGame...`);
                        this.props.dispatch(startRemoveGame(this.state.uuid)).then(() => {
                            console.log(`pushing to go back to / `);
                            this.setState({hasLeft: true});
                            this.props.history.push('/')
                        })
                    } else {
                        console.log(`pushing to go back to / `);
                        this.props.history.push('/')
                    }
                });
        }
    };
    inviteUser = () => {
        if (this.state.invitation.invitee === this.props.user.username) {
            this.alertError("invitation error", "you can't invite yourself!");
            return;
        }
        if (
            this.props.games.filter(g => g.uuid === this.props.match.params.uuid
            )[0].players.indexOf(this.state.invitation.invitee) !== -1) {
            this.alertError("invitation error", `${this.state.invitation.invitee} is already in the lobby!`);
            return;
        }
        if (this.state.invitation.invitee !== '')
            this.props.dispatch(startInviteToLobby(this.props.match.params.uuid,
                this.state.initgame.name,
                this.state.invitation.invitee)).then(() => {
                message.success(`Invitation sent to ${this.state.invitation.invitee}.`, 5);
                this.setState({
                    invitation: {invitee: ''}
                })
            }).catch((e) => {
                if (e === EVENTS.LOBBY.INVITE_USER_FAIL) {
                    this.alertError("Invitation error.", `Sorry! Couldn't invite ${this.state.invitation.invitee}. There was an error.`);
                } else {
                    this.alertError("Invitation error.", `Sorry! Couldn't invite ${this.state.invitation.invitee}. ${JSON.stringify(e)}`);
                }
            });
    }
    gameStartHandler = () => {
        this.setState({isStartingGame: true}, () => {
            console.log(`Starting game: state: ${JSON.stringify(this.state)}`);
            this.props.dispatch(startStartGame(this.props.match.params.uuid, this.state.ncards, this.state.timelimitmins * 60)).then(() => {
                // NOTE: we should receive the socket's GAME_START, from which we go to /game/play/:uuid.
                // no need to push here.
                // this.props.history.push(`/game/play/${this.state.uuid}`);
            }).catch((e) => {
                this.alertError("Sorry!", "Our game service is experiencing some technical difficulties. Please try again later!")
                this.setState({isStartingGame: false});
            })
        });
    };
    onKickUserHandler = (username) => {
        this.props.dispatch(startKickoutUser(username, this.props.match.params.uuid)).then(() => {
            message.success(`kicked ${username} from game lobby.`, 5);
        }).catch((e) => {
            message.error(`failed to kick ${username} from game lobby.`, 5);
        })
    }

    render() {
        const currentgame = this.props.games.filter(g => g.uuid === this.props.match.params.uuid
        )[0];
        let msg = undefined;
        if (!this.props.user.username)
            msg = "Please log in first.";
        else if (!currentgame) {
            msg = "No such game lobby found. ";
        }
        const errorGameLobbyContent = (
            <div className="gameLobbyPage__module">
                <h2>
                    {msg}
                </h2>
                <Button onClick={() => this.props.history.push('/')}>Go back to Main page</Button>
            </div>
        );
        if (msg)
            return errorGameLobbyContent;

        const fontSizeIcon = "20px";
        return (
            <div>
                <div className="gameLobbyPage__module">
                    <Button onClick={this.onLeaveHandler}
                    >
                        {/* Invitation faillure modal */}
                        <AlertDialog
                            isShowingModal={this.state.error.showErrorModal}
                            handleClose={() => this.setState({error: {showErrorModal: false}})}
                            subject={this.state.error.subject}
                            message={this.state.error.message}
                        />
                        <Icon type={currentgame.creator === this.props.user.username ? "close-circle-o" : "home"}/>
                        {currentgame.creator === this.props.user.username ? "leave and delete game" : "leave game"}
                    </Button>
                </div>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                    <Icon type="rocket" style={{fontSize: '50px', marginRight: '10px'}}/>
                    <h1 className="mainPageHeader"> {currentgame.name}</h1>
                </div>
                <div style={{display: 'flex', flexDirection: 'row'}}>
                    <div style={{width: '70%', marginRight: '10px'}}>
                        <div className="gameLobbyPage__module">
                            <h2>players</h2>
                            <List
                                size="large"
                                bordered
                                dataSource={currentgame ? currentgame.players : []}
                                renderItem={item => (
                                    <List.Item>
                                        {currentgame.creator === item.username ?
                                            (
                                                <div style={{marginRight: "15px"}}>
                                                    <Icon type="user" style={{fontSize: fontSizeIcon}}/>
                                                    <Icon type="star-o" style={{fontSize: fontSizeIcon}}/>
                                                </div>
                                            )
                                            : (
                                                <div style={{marginRight: "30px"}}>
                                                    <Icon type="user" style={{fontSize: fontSizeIcon}}/>
                                                </div>
                                            )
                                        }


                                        <div>
                                            {item.username}
                                        </div>

                                        <div style={{
                                            position: 'absolute',
                                            right: '10px'
                                            //bottom:'6px'
                                        }}
                                        >
                                            <div>
                                                <div style={{display: 'flex', flexDirection: 'row'}}>
                                                    {item.level >= 0 ? (

                                                        <div style={{display: 'flex', flexDirection: 'row'}}>
                                                        <p style={{marginRight: '10px'}}> Lvl. {item.level + 1} - {LEVELS.EXPLEVELS[item.level].levelname}</p>

                                                        < div
                                                        className="gameLobbyPage__levelIcon"
                                                        >
                                                        <img
                                                        height={40}
                                                        width={40}
                                                        src={IMGTYPES.levels.white[item.level]}
                                                        />
                                                        </div>
                                                        </div>
                                                        ) : null}
                                                    {currentgame.creator !== item.username && currentgame.creator === this.props.user.username ?
                                                        (
                                                            <div
                                                                style={{marginLeft:'10px', cursor: 'pointer'}}
                                                                onClick={() => this.onKickUserHandler(item.username)}
                                                            >
                                                                <Icon type="close-circle-o"
                                                                      style={{fontSize: '20px'}}/>
                                                            </div>
                                                        ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </List.Item>)}
                            />
                        </div>
                        <div className="gameLobbyPage__module">
                            <h4>shuffling cards...</h4>
                            <div>
                                <ReactLoading type={this.state.loadingtypes[this.state.loadingidx]} color={"blue"}
                                              height={100} width={100}/>
                            </div>
                            {currentgame.creator === this.props.user.username ?
                                (null)
                                :
                                (<h3>Waiting for {currentgame.creator} to start the game...</h3>)
                            }
                        </div>
                        {
                            currentgame.creator === this.props.user.username ?
                                (
                                    <div>
                                        <div className="gameLobbyPage__module">
                                            {currentgame.players.length > 1 ?
                                                (
                                                    <Button onClick={this.gameStartHandler}>
                                                        <Icon type="caret-right"/>
                                                        Start
                                                    </Button>
                                                ) :
                                                (
                                                    <Alert
                                                        type="warning"
                                                        message="Can't start game yet."
                                                        description="You need at least 2 players to start a game! invite others!"
                                                        showIcon
                                                        iconType="exclamation-circle-o"
                                                    />
                                                )
                                            }
                                        </div>
                                    </div>
                                ) : null
                        }
                        <div className="gameLobbyPage__module" style={{width: '40%'}}>
                            <h3>Invite people here:</h3>
                            <div style={{display: 'flex', flexDirection: 'row'}}>
                                <div style={{width: '85%'}}>
                                    <Input value={this.state.invitation.invitee}
                                           onPressEnter={this.inviteUser}
                                           onChange={(e) => this.setState({invitation: {invitee: e.target.value}})}/>
                                </div>
                                <div style={{width: '15%'}}>
                                    <Button onClick={this.inviteUser}>
                                        invite
                                    </Button>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div style={{width: '35%', paddingRight: '10px'}}>
                        <h2>Lobby Chat</h2>
                        <ChatRoom
                            messageFeed={this.props.roomchat}
                            namespace={this.props.match.params.uuid}
                            onMessageSend={(msg) => this.props.dispatch(startSendMessage(msg, this.props.match.params.uuid))}
                            username={this.props.user.username}
                        />
                        {
                            currentgame.creator === this.props.user.username ?
                                (
                                    <div className="gameLobbyPage__module">
                                        <h2>
                                            Game settings
                                        </h2>
                                        <Row>
                                            <h4>Cards per player:</h4>
                                            <Col span={12}>
                                                <Slider min={5} max={30} onChange={(val) => {
                                                    this.setState({ncards: val})
                                                }} value={this.state.ncards}/>
                                            </Col>
                                            <Col span={4}>
                                                <InputNumber
                                                    min={5}
                                                    max={30}
                                                    style={{marginLeft: 16}}
                                                    value={this.state.ncards}
                                                    onChange={(val) => this.setState({ncards: val})}
                                                />
                                            </Col>
                                        </Row>
                                        <Row>
                                            <h4>time limit:</h4>
                                            <Col span={12}>
                                                <Slider min={3} max={8} onChange={(val) => {
                                                    this.setState({timelimitmins: val})
                                                }} value={this.state.timelimitmins}/>
                                            </Col>
                                            <Col span={4}>
                                                <InputNumber
                                                    min={3}
                                                    max={8}
                                                    style={{marginLeft: 16}}
                                                    value={this.state.timelimitmins}
                                                    onChange={(val) => this.setState({timelimitmins: val})}
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                ) : null
                        }
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    games: state.games,
    user: state.user,
    roomchat: state.chat.room
});

export default connect(mapStateToProps)(GameLobbyPage);
