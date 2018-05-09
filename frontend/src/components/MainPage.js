import React, {Component} from 'react';
import {startJoinGame} from "../actions/games";
import {registerUser} from "../actions/user";
import GameList from './GameList';
import Modal from 'react-modal';
import ReactLoading from 'react-loading';
import {connect} from 'react-redux';
import {Input}from 'antd';
class MainPage extends Component {
    state={
        username: this.props.user.username,
        inputusername:"",
        password:"",
        isJoiningGame:false,
    }
    onGameJoinHandler= (gameId)=>{
        this.setState({isJoiningGame:true});
        this.props.dispatch(startJoinGame(gameId,this.state.username)).then((/*empty resolve arg*/)=>{
             this.props.history.push(`/game/lobby/${gameId}`);
        }).catch((e)=>{
            alert("Sorry! There was a server error.");
        })
        //TODO: axios returns promise from action.
        // we render a modal for loading until the promise is returned.
        // for now, the promise is just a stub to simulate server response time.

    }
    nameSubmitHandler= (e)=>{
        if(this.state.inputusername === ''){
            alert("name can't be empty!");
            return;
        }
        if(this.state.password === '') {
            alert("password can't be empty!");
            return;
        }
        let isValidName = true;
        this.props.games.forEach((game)=>{
            game.players.forEach((player_username)=>{
                if(player_username === this.state.inputusername){
                    // TODO: clientside duplicate validation to be replaced with
                    // TODO: Make this validation implicit in the action registerUser below.
                    //serverside duplicate validation
                    alert(`username ${this.state.inputusername} already taken.`)
                    isValidName= false;
                }
            })
        })
        if (!isValidName)
            return;
        this.props.dispatch(registerUser(this.state.inputusername));
        alert(`user with username ${this.state.inputusername} registered.`)
        // no race condition so below is ok.
        this.setState({
            username: this.state.inputusername
        })
        
        console.log(`${JSON.stringify(this.state)}`);
    }
    render(){
        const registerModal = (
               <Modal
               contentLabel="What's your name?"
               isOpen={!this.state.username}
                   >
                   <h1> Hey! Welcome to tepuk nyamuk. </h1>
               <Input size="large"
                      placeholder="name"
                      value={this.state.inputusername }
                      onPressEnter={this.nameSubmitHandler}
                      style={{marginBottom: "4px"}}
                      onChange={(e)=>{this.setState({ inputusername: e.target.value})}}
               />
                   <Input size="large"
                          placeholder="password"
                          type={"password"}
                          value={this.state.password}
                          onPressEnter={this.nameSubmitHandler}
                          onChange={(e)=>{this.setState({password: e.target.value})}}
                   />
                   <h4>Press enter to submit your name.</h4>
               </Modal>
           );

        const joinGameModal = (
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

    <div className="mainPageContainer">

        <h1 className="mainPageHeader"> Tepuk Nyamuk </h1>
        {registerModal}
        Main page here.
        You should be able to :
        -> See the list of open games (not in progress yet)
        -> join open games
        -> create own game
        {this.state.isJoiningGame? joinGameModal:null}
        <GameList
        onJoin={this.onGameJoinHandler}
        games={this.props.games}
        />
    </div>
    );
}
}
const mapStateToProps = (state)=>({
    games:state.games,
    user:state.user
});
export default connect (mapStateToProps)(MainPage);
