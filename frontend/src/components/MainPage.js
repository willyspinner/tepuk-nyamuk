import React, {Component} from 'react';
import {startCreateGame, startedGame, startJoinGame, startLeaveGame} from "../actions/games";
import {startLoginUser, startRegisterUser, connectSocket, startLogoutUser} from "../actions/user";
import {receiveMessage, startSendMessage} from "../actions/chatroom";
import {joinGame,startGetOpenGames,addGame,removeGame,gamesEmptyReduxState} from "../actions/games";
import GameList from './GameList';
import Modal from 'react-modal';
import GamePlayTutorial from './GamePlayTutorial';
import ReactLoading from 'react-loading';
import {connect} from 'react-redux';
import {Input, Button} from 'antd';
import {initializeGame,playerThrow,playerSlap,receiveMatchResult} from "../actions/gameplay";
import ChatRoom from './ui/ChatRoom';
import CreateGameForm from './ui/CreateGameForm';
import SocketClient from '../socket/socketclient';
class MainPage extends Component {
    state = {
        inputusername: "",
        password: "",
        repeatPassword: "",
        isJoiningGame: false,
        isLoggingIn: true,
        showTutorial: false,
        isCreatingGame: false,
        socketclient: SocketClient
    }
    componentDidMount(){
        Modal.setAppElement('#app');
    }
    validateInput = () => {
        if (this.state.inputusername === '')
            return {success: false, error: "name can't be empty"};
        if (this.state.password === '')
            return {success: false, error: "password can't be empty!"};
        if (!this.state.isLoggingIn && this.state.repeatPassword !== this.state.password)
            return {success: false, error: "passwords do not match"}
        return {success: true}
    }
    connectToGameUpdates= () =>{
        const connectionStr =`http://${process.env.APPCS_HOST}:${process.env.APPCS_PORT}`;
        this.state.socketclient.connect(connectionStr, this.props.user.token).then((socketid)=>{
            this.props.dispatch(connectSocket(socketid));
            console.log(`connected here 1 `);
            this.props.dispatch(startGetOpenGames()).then(()=>{
                console.log(`connected here 2 `);
                //TODO: This needs to be abstracted away. We shouldn't need to call
                //TODO: socketclient anywhere... Socketclient should reside inside the redux actions.
                this.state.socketclient.subscribeToMainPage((newGame) =>
                        this.props.dispatch(addGame(newGame))
                    , (deletedGameuuid)=>
                        this.props.dispatch(removeGame( deletedGameuuid)),
                    (newMessageObj)=>this.props.dispatch(receiveMessage(newMessageObj)),
                    (onGameStarted)=>{
                        this.props.dispatch(startedGame(onGameStarted.gameuuid));
                    }
                );
            }).catch((e)=>{
                alert(`MainPage::connectToGameUpdates: couldnt get open games. error: ${e}`);
            });
        }).catch((e)=>{
           alert(`couldn't connect to live game updates... server timed out.${JSON.stringify(e)}`);
        })
    }

    loginUserHandler = () => {
        console.log(`calling loginUserHandler`);
        let validateInput = this.validateInput();
        if (!validateInput.success){
            alert(validateInput.error);
            return;
        }
        this.props.dispatch(startLoginUser(this.state.inputusername, this.state.password))
            .then(() => {
                this.connectToGameUpdates();
            }).catch((e) => {
            if (e.error)
                alert(e.error);
            else
                alert(JSON.stringify(e));
        });
    }
    onGameLobbyStart = (gamestartobj)=>{
        //NOTE: for now, make this here, and see what happens.
        // refactor as needed later.
        const onPlayerSlapRegistered = (data)=>{
            this.props.dispatch(playerSlap(data.username,data.reactiontime));
        };
        const onNextTick= (nextTick)=>{
            this.props.dispatch(playerThrow(
                nextTick.playerthrew,
                nextTick.piletop,
                nextTick.nextplayer
                ));
        };
        const onMatchResult= (result)=>{
            this.props.dispatch(receiveMatchResult(
                result.loser,
                result.loserAddToPile,
                result.nextplayer));
        }
        const onGameStart = ({playerinturn,players,nhand})=>{
            this.props.dispatch(initializeGame(playerinturn,players,nhand));

        }
        //TODO TODO: again, socket logic shouldnt be here.
        //TODO: also, this is game logic. Shouldn't this be later?
        this.state.socketclient.subscribeToGameplay(gamestartobj,
            this.props.user.username,
            onPlayerSlapRegistered,
            onNextTick,
            onMatchResult,onGameStart).then(()=>{
            this.props.history.push(`/game/play/${gamestartobj.gamesessionid}`);
        })
    }
    onLeaderGameJoinHandler = (gameId)=>{
        this.setState({isJoiningGame:true});
        // the leader just goes straight to his/her lobby .
        //NOTE: both joining methods are diff because onLeaderGameJoinHandler is called when no one is in the room.
        // onGameJoinHandler needs to populate the game with the players .

        this.props.dispatch(startJoinGame(gameId, this.props.user.username,this.onGameLobbyStart,()=>{} )).then((/*empty resolve arg*/) => {
            this.props.history.push(`/game/lobby/${gameId}`);
        }).catch((e)=>{
            alert(JSON.stringify(e))
            this.setState({isJoiningGame:false});
        });
    }
    onGameJoinHandler = (gameId) => {
        this.setState({isJoiningGame: true});
        const onGameDeleted= (gameuuid)=>{
            this.props.dispatch(startLeaveGame(gameuuid,this.props.user.username))
                .then(() => {
                    this.props.history.push('/');
                })
        }
        this.props.dispatch(startJoinGame(gameId, this.props.user.username,this.onGameLobbyStart,onGameDeleted)).then((playersInLobby) => {
            playersInLobby.forEach((player)=>{
                this.props.dispatch(joinGame(gameId,player))
                //NOTE:: calling joinGame multiple times on a single player doesn't affect him because we check for presence
                // in the reducer already.
            })
            this.props.history.push(`/game/lobby/${gameId}`);
        }).catch((e) => {
            alert("Sorry! There was a server error.");
            this.setState({isJoiningGame: false});
        })
        // we render a modal for loading until the promise is returned.
        // for now, the promise is just a stub to simulate server response time.

    }

    registerUserHandler = () => {
        console.log(`calling loginUserHandler`);
        let validateInput = this.validateInput();
        if (!validateInput.success){
            alert(validateInput.error);
            return;
        }
        this.props.dispatch(startRegisterUser(this.state.inputusername,
            this.state.password))
            .then(() => {
                this.connectToGameUpdates();
            }).catch((e) => {
            if (e.error)
                alert(e.error);
            else
                alert(JSON.stringify(e));
        })
    }

    onTutorialStartHandler = () => {
        const allplayers = [this.props.user.username, "bob", "berdog", "Jonathan", "Mike"];
        const playerinturn = this.props.user.username;
        let nhands = 10;
        this.props.dispatch(initializeGame(
            playerinturn,
            allplayers,
            nhands
        ));
        this.setState((prevState) => ({
            allplayers,
            nhands,
            playerinturn,
            showTutorial: true,
        }));
    }

    logoutHandler = ()=>{
        this.setState({
            inputusername: "",
            password: "",
            repeatPassword: "",
        })
        this.props.dispatch(gamesEmptyReduxState());
        this.props.dispatch(startLogoutUser());
    }

    onGameCreateHandler=  (valuesObj)=>{
        this.props.dispatch(startCreateGame({name:valuesObj.name})).then((obj)=>{
            console.log(`game creation response: ${JSON.stringify(obj)}`);
            this.setState({isCreatingGame: false});
            this.onLeaderGameJoinHandler(obj.game.uuid);
        });
    }

    onChatMessageSendHandler = (msg)=>{
        this.props.dispatch(startSendMessage(msg,null));
    }
    render() {
        const createGameModal = (
            <Modal
                contentLabel={"Create Game"}
                isOpen={this.state.isCreatingGame}
                onRequestClose={()=>this.setState({isCreatingGame:false})}
                className="mainPage__createGameModal"
                ariaHideApp={false}
            >
                <CreateGameForm
                    onGameFormSubmit={this.onGameCreateHandler}
                />
            </Modal>
        );
        const registerModal = (
            <Modal
                contentLabel="Welcome"
                isOpen={!this.props.user.username}
                className="mainPage__registerModal"
                ariaHideApp={false}
            >
                <h2
                    style={{marginTop: "20px"}}
                >
                    Welcome.
                </h2>

                <Input size="large"
                       placeholder="name"
                       value={this.state.inputusername}
                       onPressEnter={this.state.isLoggingIn? this.loginUserHandler:this.registerUserHandler}
                       style={{marginBottom: "4px"}}
                       onChange={(e) => {
                           this.setState({inputusername: e.target.value})
                       }}
                />
                <Input size="large"
                       placeholder="password"
                       type={"password"}
                       value={this.state.password}
                       style={{marginBottom: "4px"}}
                       onPressEnter={this.state.isLoggingIn? this.loginUserHandler:this.registerUserHandler}
                       onChange={(e) => {
                           this.setState({password: e.target.value})
                       }}
                />
                {this.state.isLoggingIn ?
                    null :
                    <Input size="large"
                           placeholder="repeat password"
                           type={"password"}
                           value={this.state.repeatPassword}
                           style={{marginBottom: "4px"}}
                           onPressEnter={this.state.isLoggingIn? this.loginUserHandler:this.registerUserHandler}
                           onChange={(e) => {
                               this.setState({repeatPassword: e.target.value})
                           }}
                    />
                }
                <Button
                    type="primary"
                    style={{marginBottom:"4px", marginTop: "4px"}}
                    onClick = {this.state.isLoggingIn? this.loginUserHandler:this.registerUserHandler}
                >
                    {this.state.isLoggingIn ? "login" : "register"}
                </Button>

                <Button
                    type="dashed"
                    ghost
                    style={{marginTop:"4px", marginBottom: "12px"}}
                    onClick={() => {
                        console.log(`logging in changed`);
                        this.setState((prevState) => ({isLoggingIn: !prevState.isLoggingIn}))
                    }}
                >
                    {this.state.isLoggingIn ?
                        "First time here? Click me!"
                        :
                        "Already a registered user? Click me!"
                    }
                </Button>
            </Modal>
        );

        const joinGameModal = (
            //TODO: Fix modal styling - contents need to be centered.
            <Modal
                className="mainPage__joinModal"
                isOpen={this.state.isJoiningGame}
                contentLabel="Joining game..."
                ariaHideApp={false}
            >
                <ReactLoading type={"cylon"} color={"blue"} height={159} width={90}/>
                <h1> joining game...</h1>
            </Modal>);


        const tutorialModal = (
            <Modal
                isOpen={true}
                ariaHideApp={false}
            >
                <GamePlayTutorial
                    tutorialLevel={3}
                    nhands={this.state.nhands}
                    allplayers={this.state.allplayers}
                    playerinturn={this.state.playerinturn}
                />
            </Modal>

        );
        return (

            <div className="mainPageContainer">
                {!!this.props.user.username?
                    (
                        <Button
                            onClick={this.logoutHandler}
                        >Logout</Button>
                    ):null}
                <h1 className="mainPageHeader"> Tepuk Nyamuk </h1>
                {/* modals here */}
                {createGameModal}
                {registerModal}
                {joinGameModal}
                {this.state.showTutorial ? tutorialModal : null}
                <Button
                onClick={()=>this.setState({isCreatingGame:true})}>
                    Create a game
                </Button>
                <div style={{display:'flex',flexDirection:'row'}}>
                    <div style={{width:'35%'}}>
                        <h2>Chatroom</h2>
                        <ChatRoom
                            messageFeed={this.props.mainchat}
                            namespace={null}
                            onMessageSend={this.onChatMessageSendHandler}
                            username={this.props.user.username}
                        />
                    </div>
                    <div>
                        <h2>Games</h2>
                    <GameList
                        onJoin={this.onGameJoinHandler}
                        games={this.props.games}
                    />
                    </div>
                </div>
                Don't know how to play? Do a tutorial below.
                <Button onClick={this.onTutorialStartHandler}>
                    Tutorial
                </Button>
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    games: state.games,
    user: state.user,
    mainchat: state.chat.main
});
export default connect(mapStateToProps)(MainPage);
