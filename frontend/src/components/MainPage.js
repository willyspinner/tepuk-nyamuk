import React, {Component} from 'react';
import {startCreateGame, startedGame, startJoinGame, startLeaveGame} from "../actions/games";
import {
    startLoginUser,
    startRegisterUser,
    connectSocket,
    startLogoutUser,
    discardInvitation,
    receiveInvitation,
    updateExpObject
} from "../actions/user";
import ExpUpdateModal from './ExpUpdateModal';
import {initChat, receiveMessage, startSendMessage} from "../actions/chatroom";
import {joinGame, startGetOpenGames, addGame, removeGame, gamesEmptyReduxState} from "../actions/games";
import GameList from './GameList';
import Modal from 'react-modal';
import GamePlayTutorial from './GamePlayTutorial';
import ReactLoading from 'react-loading';
import {Icon, Button} from 'antd';
import {connect} from 'react-redux';
import AuthenticationModal from './RegisterModal';
import ChatRoom from './ui/ChatRoom';
import CreateGameForm from './ui/CreateGameForm';
import socketclient from '../socket/socketclient';
import AlertDialog from './ui/AlertDialog';
import InvitationDialog from './ui/InvitationDialog';
import RankingsList from "./RankingsList";
import {startGetRankings} from "../actions/rankings";
class MainPage extends Component {
    state = {
        inputusername: "",
        password: "",
        repeatPassword: "",
        showLoadingModal: false,
        isLoggingIn: true,
        showTutorial: false,
        isCreatingGame: false,
        playingcarddemo: {
            suit: "S",
            number: 2
        },
        error: {
            subject: '',
            message: '',
            showErrorModal: false
        },
        rankingIsLoading:false
    }

    constructor(props){
        super(props);
        if(this.props.location.needConnect)
            this.connectToGameUpdates();

    }
    componentWillUnmount(){
        console.log('COMPONENT WILL UNMOUNT.');
    }
    componentDidMount() {
        console.log('MAIN PAGE COMPONENT DID MOUNT')
        Modal.setAppElement('#app');
        /*
        check if we have any error dialog messages when going to mainpage.
         */
        if (this.props.location.dialog) {
            this.alertError(this.props.location.dialog.subject,
                this.props.location.dialog.message
            );
        }
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

    validateInput = () => {
        if (this.state.inputusername === '')
            return {success: false, error: "name can't be empty."};
        if (this.state.password === '')
            return {success: false, error: "password can't be empty."};
        if (!this.state.isLoggingIn && this.state.repeatPassword !== this.state.password)
            return {success: false, error: "passwords do not match."}
        return {success: true}
    }
    connectToGameUpdates = () => {
        const connectionStr = `${process.env.NODE_ENV === 'production'?'https':'http'}://${process.env.API_HOST}:${process.env.API_PORT}`;
        socketclient.connect(connectionStr, this.props.user.token,undefined,'appcs'
            ).then((socketid) => {
            this.props.dispatch(connectSocket(socketid));
            console.log(`connected here 1 `);
            this.props.dispatch(startGetOpenGames()).then(() => {
                console.log(`connected here 2 `);
                //TODO: This needs to be abstracted away. We shouldn't need to call
                //TODO: socketclient anywhere... Socketclient should reside inside the redux actions.
                socketclient.subscribeToMainPage((newGame) =>
                        this.props.dispatch(addGame(newGame))
                    , (deletedGameuuid) =>
                        this.props.dispatch(removeGame(deletedGameuuid)),
                    (newMessageObj) => this.props.dispatch(receiveMessage(newMessageObj)),
                    (onGameStarted) => {
                        this.props.dispatch(startedGame(onGameStarted.gameuuid));
                    },
                    (invitation)=>{
                    this.props.dispatch(receiveInvitation(invitation));
                    },
                    (onRecvNotif)=>{
                        if(onRecvNotif.type ==='EXP'){
                            if( this.props.location.expUpdate){
                                //TODO show modal here.
                                this.setState({
                                    showExpModal: true,
                                    expModalDetails: {
                                        previousExp: this.props.user.currentExp,
                                        previousLevelIdx : this.props.user.currentLevelIdx,
                                        previousLevelObj: this.props.user.currentLevelObj,
                                        currentExp: onRecvNotif.expObject.currentExp,
                                        currentLevelIdx: onRecvNotif.expObject.currentLevelIdx,
                                        currentLevelObj: onRecvNotif.expObject.currentLevelObj,
                                    }
                                },()=>{
                                this.props.dispatch(updateExpObject(onRecvNotif.expObject))
                                })
                            }else
                                this.props.dispatch(updateExpObject(onRecvNotif.expObject))
                        }
                    }
                );
            }).catch((e) => {
                this.alertError('server error. Sorry!',
                    `couldn't get open games. Server error. Please try again later. ${JSON.stringify(e)}`
                );
            });
        }).catch((e) => {
            this.alertError(
                'server error. Sorry!',
                `couldn't connect to socket for live updates. Server error. Please try again later. ${JSON.stringify(e)}`
            );
        })
    }

    getRankings = () =>{
        this.setState({rankingIsLoading : true});
        console.log(`getting ranking ting with token : ${this.props.user.token}`)
        this.props.dispatch(startGetRankings(this.props.user.token)).then(()=>{
            this.setState({rankingIsLoading : false});
        }).catch((e)=>{
            this.setState({rankingIsLoading : false});
            this.alertError("Sorry!", `Couldn't get rankings. Unfortunately, there was a server error. ${JSON.stringify(e)}`);
        });
    }
    loginUserHandler = () => {
        console.log(`calling loginUserHandler`);
        let validateInput = this.validateInput();
        if (!validateInput.success) {
            this.alertError(
                'input validation error.',
                `${validateInput.error}`
            );
            return;
        }
        this.setState({showLoadingModal:true, loadingmodaltext:`Logging in as ${this.state.inputusername}...`})
        this.props.dispatch(startLoginUser(this.state.inputusername, this.state.password))
            .then((resObj) => {
                this.props.dispatch(initChat(resObj.stringifiedmainchat.map((obj)=>JSON.parse(obj))));
                this.props.dispatch(updateExpObject(resObj.expObject));
                this.connectToGameUpdates();
                this.getRankings();
                this.setState({showLoadingModal : false});
            }).catch((e) => {
            this.setState({showLoadingModal : false});
                this.alertError(
                    'login error.',
                    'authentication failed.'
                );
        });
    }

    onGameLobbyStart = (gamestartobj) => {
       // socketclient.emitMovingToGms().then(()=>{
            this.props.history.push({
                pathname: `/game/play/${gamestartobj.gamesessionid}`,
                gamestartobj: gamestartobj
            })
        //})
    }

    onLeaderGameJoinHandler = (gameId) => {
        this.setState({
            showLoadingModal: true,
            loadingmodaltext:'Joining game...'
        });
        // the leader just goes straight to his/her lobby .
        //NOTE: both joining methods are diff because onLeaderGameJoinHandler is called when no one is in the room.
        // onGameJoinHandler needs to populate the game with the players .

        this.props.dispatch(startJoinGame(gameId, this.props.user.username, this.onGameLobbyStart, () => {
        })).then((/*empty resolve arg*/) => {
            this.props.history.push(`/game/lobby/${gameId}`);
        }).catch((e) => {
            this.alertError('error creating and joining game. Please try again later!',
                JSON.stringify(e)
            )
            this.setState({showLoadingModal: false});
        });
    }

    onGameJoinHandler = (gameId) => {
        this.setState({showLoadingModal: true, loadingmodaltext: 'Joining game...'});
        const onGameDeleted = (gameuuid) => {
            this.props.dispatch(startLeaveGame(gameuuid, this.props.user.username))
                .then(() => {
                    this.props.history.push({
                        pathname: '/',
                        dialog: {
                            subject: 'Sorry!',
                            message: 'your game lobby leader has deleted the game.'
                        }
                    });
                })
        }
        const onKickedOut =() =>{
            this.props.dispatch(startLeaveGame(gameId, this.props.user.username))
                .then(() => {
                    this.props.history.push({
                        pathname: '/',
                        dialog: {
                            subject: 'Sorry!',
                            message: 'your game lobby leader has kicked you out.'
                        }
                    });
                })

        }
        this.props.dispatch(startJoinGame(gameId, this.props.user.username, this.onGameLobbyStart, onGameDeleted,onKickedOut)).then((playersInLobby) => {
            playersInLobby.forEach((player) => {
                this.props.dispatch(joinGame(gameId, player))
                //NOTE:: calling joinGame multiple times on a single player doesn't affect him because we check for presence
                // in the reducer already.
            })
            this.props.history.push(`/game/lobby/${gameId}`);
        }).catch((errormsg) => {
            this.alertError('Sorry!',errormsg);
            this.setState({showLoadingModal: false});
        })
        // we render a modal for loading until the promise is returned.
        // for now, the promise is just a stub to simulate server response time.

    }

    registerUserHandler = () => {
        console.log(`calling registerUserHandler`);
        let validateInput = this.validateInput();
        if (!validateInput.success) {
            this.alertError('registration error.', validateInput.error);
            return;
        }
        this.props.dispatch(startRegisterUser(this.state.inputusername,
            this.state.password))
            .then((resObj) => {
                this.getRankings();
                this.props.dispatch(initChat(resObj.stringifiedmainchat.map((obj)=>JSON.parse(obj))));
                this.props.dispatch(updateExpObject(resObj.expObject));
                this.connectToGameUpdates();
            }).catch((e) => {
            if (e.error) {

                this.alertError('registration error', e.error);
            }
            else {

                this.alertError('registration error', JSON.stringify(e));
            }
        })
    }

    onTutorialStartHandler = () => {
        this.setState((prevState) => ({
            showTutorial: true,
        }));
    }

    logoutHandler = () => {
        this.setState({
            inputusername: "",
            password: "",
            repeatPassword: "",
        })
        this.props.dispatch(gamesEmptyReduxState());
        this.props.dispatch(startLogoutUser());
    }

    onGameCreateHandler = (valuesObj) => {
        this.props.dispatch(startCreateGame(valuesObj)).then((obj) => {
            console.log(`game creation response: ${JSON.stringify(obj)}`);
            this.setState({isCreatingGame: false});
            this.onLeaderGameJoinHandler(obj.game.uuid);
        });
    }

    onChatMessageSendHandler = (msg) => {
        this.props.dispatch(startSendMessage(msg, null));
    }

    handleAcceptInvitation = () => {
        const gameid = this.props.user.invitation.gameid;
        this.props.dispatch(discardInvitation());
        this.onGameJoinHandler(gameid);
    }
    handleDeclineInvitation = () => {
        this.props.dispatch(discardInvitation());
    }

    render() {
        const createGameModal = (
            <Modal
                isOpen={this.state.isCreatingGame}
                //onRequestClose={() => this.setState({isCreatingGame: false})}
                className="mainPage__createGameModal"
                ariaHideApp={false}
            >
                <h2 style={{color:'white',alignSelf:'center', marginTop: '8px'}}> Create a game</h2>
                <CreateGameForm
                    onGameFormSubmit={this.onGameCreateHandler}
                    onClose={()=>this.setState({isCreatingGame: false})}
                />
            </Modal>
        );

        const registerModal = (
            <AuthenticationModal
                history={this.props.history}
                isOpen={!this.props.user.username}
                inputUsernameValue={this.state.inputusername}
                onInputUsernameChange={(e) => {
                    this.setState({inputusername: e.target.value})
                }}
                inputPasswordValue={this.state.password}
                onInputPasswordChange={(e) => {
                    this.setState({password: e.target.value})
                }}
                inputRepeatPasswordValue={this.state.repeatPassword}
                onInputRepeatPasswordChange={(e) => {
                    this.setState({repeatPassword: e.target.value})
                }}
                onPressEnter={this.state.isLoggingIn ? this.loginUserHandler : this.registerUserHandler}
                isLoggingIn={this.state.isLoggingIn}
                onTypeChange={() => {
                    console.log(`logging in changed`);
                    this.setState((prevState) => ({isLoggingIn: !prevState.isLoggingIn}))
                }}


            />
        );
        const LoadingModal = (
            //TODO: Fix modal styling - contents need to be centered.
            <Modal
                className="mainPage__joinModal"
                isOpen={this.state.showLoadingModal}
                contentLabel="Joining game..."
                ariaHideApp={false}
            >
                <div style={{margin: '0 auto' ,display:'flex',flexDirection:'column',alignItems:'center'}}>
                <ReactLoading type={"cylon"} color={"white"} height={200} width={120}
                />
                <h1 style={{color:'white'}}> {this.state.loadingmodaltext} </h1>
                </div>
            </Modal>);


        const tutorialModal = (
            <Modal
                isOpen={this.state.showTutorial}
                ariaHideApp={false}
                onRequestClose={() => {
                    this.setState({showTutorial: false});
                }
                }
            >
                <GamePlayTutorial
                    myusername={this.props.user.username}
                    onComplete={() => {
                        this.setState({showTutorial: false});
                    }}
                />
            </Modal>

        );
        const MainpageExpUpdateModal = (
            <ExpUpdateModal

                {...this.state.expModalDetails}

                isOpen={this.state.showExpModal}
                onRequestClose={()=>this.setState({showExpModal: false})}
            />
        );
        return (

            <div className="mainPageContainer">
                {!!this.props.user.username ?
                    (
                        <Button
                            style={{width: "10%"}}
                            onClick={this.logoutHandler}
                        >
                            <Icon type="logout"/>
                        </Button>
                    ) : null}
                <div style={{display: 'flex', flexDirection: "row", justifyContent: "center"}}>
                </div>
                {/* modals here */}
                {createGameModal}
                {registerModal}
                {LoadingModal}
                {tutorialModal}
                {this.state.showExpModal? MainpageExpUpdateModal: undefined}
                <AlertDialog
                    isShowingModal={this.state.error.showErrorModal}
                    handleClose={() => this.setState({error: {showErrorModal: false}})}
                    subject={this.state.error.subject}
                    message={this.state.error.message}
                />
                <InvitationDialog
                    isShowingModal={!!this.props.user.invitation}
                    invitation={this.props.user.invitation}
                    handleAcceptInvitation={this.handleAcceptInvitation}
                    handleDeclineInvitation={this.handleDeclineInvitation}
                />

                <div style={{display: 'flex', flexDirection: 'row'}}>
                    {/* chatroom div */}
                    <div style={{width: '35%'}} className="mainPage__module">
                        <h2>Chatroom</h2>
                        <ChatRoom
                            messageFeed={this.props.mainchat}
                            namespace={null}
                            onMessageSend={this.onChatMessageSendHandler}
                            username={this.props.user.username}
                        />
                    </div>
                    {/* game div */}
                    <div style={{width: "65%"}} className="mainPage__module">
                        <div style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
                        <h2>Games</h2>
                            <div style={{display:'flex',flexDirection:'row'}}>
                                {this.props.games.length > 0?
                                    (
                                < Button
                                    onClick={() => this.setState({isCreatingGame: true})}
                                    >
                                    <Icon type="plus" />
                                    </Button>
                                    )
                                    :
                                    null
                                }
                        <Button
                            onClick={()=>this.props.dispatch(startGetOpenGames(true))}>
                                <Icon type="reload" />
                        </Button>
                            </div>
                    </div>
                        <GameList
                            onJoin={this.onGameJoinHandler}
                            games={this.props.games}
                            onCreateGame={() => this.setState({isCreatingGame: true})}
                            showCreateGame={this.props.games.length ===0}
                        />
                    </div>
                </div>
                <div style={{display: 'flex', flexDirection: 'row'}}>

                    {/* instructions */}
                    <div style={{width: '40%'}}>
                        <div className="mainPage__module">
                            <h2>How to play</h2>
                            <ol>
                                <li>
                                    Everyone gets given out a personal pile of cards. They are not to look at their own
                                    hand,
                                    and must be faced down.
                                </li>
                                <li>
                                    Players count in order (Ace to King) as they throw a single card to a central pile
                                    from
                                    their hand (by pressing T).
                                </li>
                                <li>
                                    if the count matches the card's number, then everyone has to slap the central pile (pressing spacebar).
                                    The last
                                    person to slap this central pile has to get all the cards from the center.
                                </li>
                                <li>
                                    First person to finish their own hand, and successfuly slaps in 3 rounds with 0 cards on their hands
                                    wins!
                                </li>

                            </ol>

                        </div>
                        <div style={{display: 'inline-block', width: 300}} className="mainPage__module">
                            <p>
                                Wanna try it out? Do a tutorial below.
                            </p>
                            <Button onClick={this.onTutorialStartHandler}>
                                Tutorial
                                <Icon type="bulb"/>
                            </Button>
                        </div>
                    </div>
                    <div className="mainPage__module">
                    <h2>Rankings</h2>
                        <Button onClick={()=>this.getRankings()}>
                            Reload
                        </Button>
                    <RankingsList
                        rankings={this.props.rankings}
                        isLoading={this.state.rankingIsLoading}
                        isVisible ={!!(this.props.user && this.props.user.token)}

                    />
                    </div>
                </div>
            </div>
        )
            ;
    }
}

const mapStateToProps = (state) => ({
    games: state.games,
    user: state.user,
    mainchat: state.chat.main,
    rankings : state.rankings
});
export default connect(mapStateToProps)(MainPage);
