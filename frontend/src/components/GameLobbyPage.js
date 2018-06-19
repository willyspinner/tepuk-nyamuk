import React, {Component} from 'react';
import {connect} from 'react-redux';
import {List,Button} from 'antd';
import ReactLoading from 'react-loading';
import {startLeaveGame,startRemoveGame} from "../actions/games";
import ChatRoom from './ui/ChatRoom';
import {sampleChatRoomFeed} from "../constants/sampleData";
class GameLobbyPage extends Component {
    //TODO TODO - 19 Jun : onUserJoin is captured, but not ON USER LEFT!
    // The socket event is received and processed, and redux store is altered
    // correctly, but for some reason, the state doesn't change here!
    //TODO.
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
        setInterval(()=>{

            console.log(`local state:players: ${JSON.stringify(this.state.game.players)}`);

            console.log(`redux state: players: ${JSON.stringify(this.props.games)}`);
        },1000);
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
                            this.setState({hasLeft: true})
                            this.props.history.push('/')
                        })
        }else{
            console.log(`pushing to go back to / `);
            this.props.history.push('/')
        }
    });
    }
    }
    onGameStartHandler= () => {
        //TODO: this needs to be run by some redux update caused by ws.
        //TEST
        this.setState({isStartingGame:true}, ()=> {
            console.log(`Starting game: state: ${JSON.stringify(this.state)}`);
            this.props.history.push(`/game/play/${this.state.uuid}`);
        });
    }
    render(){
        if(!this.props.user.username)
            return (<h4>ERROR: GAME LOBBY</h4>);
        if(!this.state.game)
        {
            console.log(`GameLobbyPage: this.state.game undefined.`);
            return (<h4> ERROR: GAME LOBBY</h4>);
        }
        let currentgame = this.props.games.filter(g=>g.uuid === this.props.match.params.uuid
        )[0];

        return (
            <div>

                <Button onClick={this.onLeaveHandler}
                        >
                    {this.state.game.creator ===this.props.user.username?"leave and delete game": "leave game"}
                </Button>

                <h1 className="mainPageHeader"> Game Lobby Page </h1>
                lobby page here.
                You should be able to :
                -> See the list of users
                -> initiate the game when you are the gamemaster.
                <h2>players</h2>
                <List
                    size="large"
                    bordered
                    dataSource={currentgame? currentgame.players:[]}
                    renderItem={item => (<List.Item>{item}</List.Item>)}
                />
                <h5>shuffling cards...</h5>
                <ReactLoading type={"cubes"} color={"blue"} height={90} width={90} />
                <h3>Waiting for {this.state.game.creator} to start the game...</h3>

                <ChatRoom
                    messageFeed={sampleChatRoomFeed}
                />
                {
                    //TEMPDIS
                    this.state.game.creator === this.props.user.username?
                    //1===1?
                    (
                        <Button onClick={this.onGameStartHandler}>
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
    user: state.user
    })

export default connect (mapStateToProps)(GameLobbyPage);
