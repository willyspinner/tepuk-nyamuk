import React, {Component} from 'react';
import {connect} from 'react-redux';
import {List} from 'antd';
import ReactLoading from 'react-loading';
class GameLobbyPage extends Component {
    constructor(props){
        super(props);
        this.state = {
            gameId: props.match.params.gameId,
            game: this.props.games.filter(g=>{
                return g.gameId == props.match.params.gameId})[0]
        };
        
        console.log(`game: ${JSON.stringify(this.state.game)}`);
        
        console.log(`match param: ${props.match.params.gameId}`);
    }
    render(){
        return (
            <div>
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
        games: state.games
    })

export default connect (mapStateToProps)(GameLobbyPage);
