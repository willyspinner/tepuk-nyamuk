import React, {Component} from 'react';
import {connect} from 'react-redux';
import {List,Button,Icon} from 'antd';
import ReactLoading from 'react-loading';
import {startLeaveGame,startRemoveGame,startStartGame} from "../actions/games";
import ChatRoom from './ui/ChatRoom';
import Beforeunload from 'react-beforeunload';
import {startSendMessage} from "../actions/chatroom";
class GameLobbyPage extends Component {
    constructor(props){
        super(props);
        this.state = {
            hasLeft: false,
            uuid: props.match.params.uuid,
            //NOTEDIFF: I put the same code below in the render method
            // because we had a bug where onUserJoin would be reflected in this local state,
            // but onUserLeave wouldn't hmm.
            game: this.props.games.filter(g=>g.uuid === props.match.params.uuid
                )[0], // NOTE: this doesn't have to be from our props. Can just be from
            // ws connection.
            isStartingGame:false
        };
    }
    componentWillUnmount(){
        if(!this.state.hasLeft)
            this.onLeaveHandler();
    }
    onLeaveHandler=()=>{
        console.log(`leaving. Starting game? : ${this.state.isStartingGame}`);
        if(!this.state.isStartingGame){
            this.props.dispatch(startLeaveGame(this.state.uuid,this.props.user.username))
                .then(() => {
                    if(this.props.user.username === this.state.game.creator){
                        
                        console.log(`dispatching startRemoveGame...`);
                        this.props.dispatch(startRemoveGame(this.state.uuid)).then(()=>{
                            console.log(`pushing to go back to / `);
                            this.setState({hasLeft: true});
                            this.props.history.push('/')
                        })
                    }else{
                        console.log(`pushing to go back to / `);
                        this.props.history.push('/')
                    }
            });
    }
    };
    gameStartHandler= () => {
        this.setState({isStartingGame:true}, ()=> {
            console.log(`Starting game: state: ${JSON.stringify(this.state)}`);
            this.props.dispatch(startStartGame(this.props.match.params.uuid)).then(()=>{
                // NOTE: we should receive the socket's GAME_START, from which we go to /game/play/:uuid.
                // no need to push here.
                // this.props.history.push(`/game/play/${this.state.uuid}`);
            }).catch((e)=>{
                this.setState({isStartingGame: false});
                alert(`${JSON.stringify(e)}`);
            })
        });
    };
    render(){
        if(!this.props.user.username)
            return (<h4>ERROR: GAME LOBBY</h4>);
        if(!this.state.game)
        {
            console.log(`GameLobbyPage: this.state.game undefined.`);
            return (<h4> ERROR: GAME LOBBY</h4>);
        }

        return (
            <div>
                <Beforeunload onBeforeunload={e => this.onLeaveHandler()} />
                <Button onClick={this.onLeaveHandler}
                        >
                    <Icon type="close-circle-o" />
                    {this.state.game.creator ===this.props.user.username?"leave and delete game": "leave game"}
                </Button>
                <h1 className="mainPageHeader"> {this.state.game.name}</h1>
                <div style={{display:'flex',flexDirection:'row'}}>
                <div style={{width:'70%', marginRight:'10px'}}>
                    <h2>players</h2>
                    <List
                        size="large"
                        bordered
                        dataSource={this.state.game? this.state.game.players:[]}
                        renderItem={item => (<List.Item>{item}</List.Item>)}
                    />
                    <h5>shuffling cards...</h5>
                    <ReactLoading type={"cubes"} color={"blue"} height={90} width={90} />
                    {this.state.game.creator === this.props.user.username?
                        (null)
                        :
                            (<h3>Waiting for {this.state.game.creator} to start the game...</h3>)
                    }
                </div>
                <div style={{width:'35%',paddingRight:'10px'}}>
                    <h2>Lobby Chat</h2>
                <ChatRoom
                    messageFeed={this.props.roomchat}
                    namespace={this.props.match.params.uuid}
                    onMessageSend={ (msg)=>this.props.dispatch(startSendMessage(msg,this.props.match.params.uuid))}
                    username={this.props.user.username}
                />
                </div>
                </div>
                {
                    //TEMPDIS
                    this.state.game.creator === this.props.user.username?
                    //1===1?
                    (
                        <Button onClick={this.gameStartHandler}>
                            <Icon type="caret-right" />
                            Start game
                        </Button>)
                : null
                }
            </div>
        );
    }
}
const mapStateToProps = (state)=>({
        games: state.games,
    user: state.user,
    roomchat: state.chat.room
    });

export default connect (mapStateToProps)(GameLobbyPage);
