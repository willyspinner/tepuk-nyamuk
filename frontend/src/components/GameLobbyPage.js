import React, {Component} from 'react';
import {connect} from 'react-redux';
import {List,Button} from 'antd';
import ReactLoading from 'react-loading';
import {startLeaveGame} from "../actions/games";

class GameLobbyPage extends Component {
    constructor(props){
        super(props);
        this.state = {
            gameId: props.match.params.gameId,
            game: this.props.games.filter(g=>{
                return g.gameId === props.match.params.gameId})[0]
        };
    }
    componentWillUnmount(){
        this.onLeaveHandler();
    }
    onLeaveHandler=()=>{
        this.props.dispatch(startLeaveGame(this.state.gameId,this.props.user.username))
            .then(() => {
                this.props.history.push('/')
            })
    }
    render(){
        if(!this.props.user.username)
            return (<h4>Please log in first!</h4>);
        return (
            <div>
                <Button onClick={this.onLeaveHandler}
                        >
                    leave game
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
                    dataSource={this.state.game.players}
                    renderItem={item => (<List.Item>{item}</List.Item>)}
                />
                <h5>shuffling cards...</h5>
                <ReactLoading type={"cubes"} color={"blue"} height={90} width={90} />
                <h3>Waiting for {this.state.game.creator} to start the game...</h3>

            </div>
        );
    }
}
const mapStateToProps = (state)=>({
        games: state.games,
    user: state.user
    })

export default connect (mapStateToProps)(GameLobbyPage);
