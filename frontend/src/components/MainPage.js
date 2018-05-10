import React, {Component} from 'react';
import {startJoinGame} from "../actions/games";
import {registerUser} from "../actions/user";
import GameList from './GameList';
import Modal from 'react-modal';
import GamePlayTutorial from './GamePlayTutorial';
import ReactLoading from 'react-loading';
import {connect} from 'react-redux';
import {Input,Button} from 'antd';
class MainPage extends Component {
    state={
        username: this.props.user.username,
        inputusername:"",
        password:"",
        repeatPassword:"",
        isJoiningGame:false,
        isLoggingIn: true,
        showTutorial : false
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
    nameSubmitHandler= ()=>{
        if(this.state.inputusername === ''){
            alert("name can't be empty!");
            return;
        }
        if(this.state.password === '') {
            alert("password can't be empty!");
            return;
        }
        if(!this.state.isLoggingIn && this.state.repeatPassword !== this.state.password){
            alert("passwords do not match");
            return;
        }

        let isValidName = true;
        // TODO: clientside duplicate validation to be replaced with
        // TODO: Make this validation implicit in the action registerUser below.
        // DANGER: the below is not correct for username validation.
        this.props.games.forEach((game)=>{
            game.players.forEach((player_username)=>{
                if(player_username === this.state.inputusername){
                    //serverside duplicate validation
                    alert(`username ${this.state.inputusername} already taken.`)
                    isValidName= false;
                }
            })
        })
        if (!isValidName)
            return;
        this.props.dispatch(registerUser(this.state.inputusername));
        // no race condition so below is ok.
        this.setState({
            username: this.state.inputusername
        })

    }
    render(){
        const registerModal = (
               <Modal
               contentLabel="Welcome"
               isOpen={!this.state.username}
               className="mainPage__registerModal"
                   >
                   <h2
                       style={{marginTop:"10px"}}
                   >
                       Welcome.
                   </h2>

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
                          style={{marginBottom: "4px"}}
                          onPressEnter={this.nameSubmitHandler}
                          onChange={(e)=>{this.setState({password: e.target.value})}}
                   />
                   {this.state.isLoggingIn ?
                       null :
                       <Input size="large"
                              placeholder="repeat password"
                              type={"password"}
                              value={this.state.repeatPassword}
                              style={{marginBottom: "4px"}}
                              onPressEnter={this.nameSubmitHandler}
                              onChange={(e) => {
                                  this.setState({repeatPassword: e.target.value})
                              }}
                       />
                   }
                   <Button
                        type="primary"
                        onClick={this.nameSubmitHandler}
                   >
                       {this.state.isLoggingIn? "login": "register"}
                   </Button>
                   <Button
                      type="dashed"
                      ghost
                       onClick={()=>{
                           console.log(`logging in changed`);
                           this.setState((prevState)=>({isLoggingIn: !prevState.isLoggingIn}))
                       }}
                   >
                       {this.state.isLoggingIn?
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
            isOpen = {this.state.isJoiningGame}
            contentLabel = "Joining game..."
            ariaHideApp = {false}
        >
                <ReactLoading type={"cylon"} color={"blue"} height={159} width={90} />
                <h1> joining game...</h1>
        </Modal>);
        const tutorialModal = (
            <Modal
                isOpen={this.state.showTutorial}
            >
                <GamePlayTutorial isTutorial={true} tutorialLevel={3}/>
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
        { /* modals here */ }
        {registerModal}
        {joinGameModal}
        {tutorialModal}
        <GameList
        onJoin={this.onGameJoinHandler}
        games={this.props.games}
        />
        Don't know how to play? Do a tutorial below.
        <Button onClick={()=>this.setState((prevState)=>({showTutorial: !prevState.showTutorial}))}>
            Tutorial
        </Button>
    </div>
    );
}
}
const mapStateToProps = (state)=>({
    games:state.games,
    user:state.user
});
export default connect (mapStateToProps)(MainPage);
