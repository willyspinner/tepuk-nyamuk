import React, {Component} from 'react';
import {startJoinGame} from "../actions/games";
import {startLoginUser, startRegisterUser} from "../actions/user";
import GameList from './GameList';
import Modal from 'react-modal';
import GamePlayTutorial from './GamePlayTutorial';
import ReactLoading from 'react-loading';
import {connect} from 'react-redux';
import {Input, Button} from 'antd';
import {initializeGame} from "../actions/gameplay";
import ChatRoom from './ui/ChatRoom';
import {sampleChatRoomFeed} from "../constants/sampleData";

class MainPage extends Component {
    state = {
        username: this.props.user.username,
        inputusername: "",
        password: "",
        repeatPassword: "",
        isJoiningGame: false,
        isLoggingIn: true,
        showTutorial: false,
        registerModalOpen: true,
    }
    onGameJoinHandler = (gameId) => {
        this.setState({isJoiningGame: true});
        this.props.dispatch(startJoinGame(gameId, this.state.username)).then((/*empty resolve arg*/) => {
            this.props.history.push(`/game/lobby/${gameId}`);
        }).catch((e) => {
            alert("Sorry! There was a server error.");
        })
        //TODO: axios returns promise from action.
        // we render a modal for loading until the promise is returned.
        // for now, the promise is just a stub to simulate server response time.

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
    loginUserHandler = () => {
        if (!this.validateInput().success)
            return;
        this.props.dispatch(startLoginUser(this.state.inputusername, this.state.password))
            .then(() => {
                this.setState({
                    username: this.state.username,
                    registerModalOpen: false
                });
            }).catch((e) => {
            if (e.error)
                alert(e.error);
            else
                alert(JSON.stringify(e));
        });
    }
    registerUserHandler = () => {
        if (!this.validateInput().success)
            return;


        this.props.dispatch(startRegisterUser(this.state.inputusername,
            this.state.password))
            .then(() => {
                this.setState({
                    username: this.state.username,
                    registerModalOpen: false
                });
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


    render() {
        const registerModal = (
            <Modal
                contentLabel="Welcome"
                isOpen={this.state.registerModalOpen}
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
                       onPressEnter={this.isLoggingIn? this.loginUserHandler:this.registerUserHandler}
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
                       onPressEnter={this.isLoggingIn? this.loginUserHandler:this.registerUserHandler}
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
                           onPressEnter={this.isLoggingIn? this.loginUserHandler:this.registerUserHandler}
                           onChange={(e) => {
                               this.setState({repeatPassword: e.target.value})
                           }}
                    />
                }
                <Button
                    type="primary"
                    onClick = {this.isLoggingIn? this.loginUserHandler:this.registerUserHandler}
                >
                    {this.state.isLoggingIn ? "login" : "register"}
                </Button>

                <Button
                    type="dashed"
                    ghost
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

                <h1 className="mainPageHeader"> Tepuk Nyamuk </h1>
                Main page here.
                You should be able to :
                -> See the list of open games (not in progress yet)
                -> join open games
                -> create own game
                {/* modals here */}
                {registerModal}
                {joinGameModal}
                {this.state.showTutorial ? tutorialModal : null}
                <GameList
                    onJoin={this.onGameJoinHandler}
                    games={this.props.games}
                />
                <ChatRoom
                    messageFeed={sampleChatRoomFeed}
                />
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
    user: state.user
});
export default connect(mapStateToProps)(MainPage);
