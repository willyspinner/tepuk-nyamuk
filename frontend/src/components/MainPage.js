import React, {Component} from 'react';
import {startJoinGame} from "../actions/games";
import GameList from './GameList';
import Modal from 'react-modal';
import ReactLoading from 'react-loading';

class MainPage extends Component {
    state={
        username: "DEFAULT_USERNAME",
        isJoiningGame:false
    }
    onGameJoinHandler= (gameId)=>{
        this.setState({isJoiningGame:true});
        startJoinGame(gameId,this.state.username);
        //TODO: axios returns promise from action.
        // we render a modal for loading until the promise is returned.
        // for now, the promise is just a stub to simulate server response time.

    }
    render(){
        const modalcontent = (
            <Modal
            isOpen = {true}
            contentLabel = "Joining game..."
            ariaHideApp = {false}
        >
                <ReactLoading type={"cyclon"} color={"blue"} height={667} width={375} />
                <h1> joining game...</h1>
        </Modal>);

    return (
    <div className="gamePageContainer">
        <h1 className="gamePageHeader"> Game Page </h1>
        Main page here.
        You should be able to :
        -> See the list of open games (not in progress yet)
        -> join open games
        -> create own game
        {this.state.isJoiningGame? modalcontent:null}
        <GameList
        onJoin={this.onGameJoinHandler}/>
    </div>
    );
}
}

export default MainPage;
