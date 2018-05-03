import React, {Component} from 'react';
import {startJoinGame} from "../actions/games";
import GameList from './GameList';
import Modal from 'react-modal';
import ReactLoading from 'react-loading';
import {connect} from 'react-redux';
class MainPage extends Component {
    state={
        username: "DEFAULT_USERNAME",
        isJoiningGame:false
    }
    onGameJoinHandler= (gameId)=>{
        this.setState({isJoiningGame:true});
        this.props.dispatch(startJoinGame(gameId,this.state.username)).then((/*empty resolve arg*/)=>{
            alert(`pushing /game/lobby/${gameId}`);
            // this.props.history.push(`/game/lobby/${gameId}`);
        })
        //TODO: axios returns promise from action.
        // we render a modal for loading until the promise is returned.
        // for now, the promise is just a stub to simulate server response time.

    }
    render(){
        const modalcontent = (
            //TODO: Fix modal styling - contents need to be centered.
            <Modal
                className=".gamePage__joinModal"
            isOpen = {true}
            contentLabel = "Joining game..."
            ariaHideApp = {false}
        >
                <ReactLoading type={"cylon"} color={"blue"} height={159} width={90} />
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
        onJoin={this.onGameJoinHandler}
        games={this.props.games}
        />
    </div>
    );
}
}
const mapStateToProps = (state)=>({
    games:state.games
});
export default connect (mapStateToProps)(MainPage);
