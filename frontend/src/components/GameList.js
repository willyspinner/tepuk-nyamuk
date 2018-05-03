import React from 'react';
import GameListItem from './GameListItem';

 class GameList extends React.Component{

     onJoinHandler = (gameId)=> {
         this.props.onJoin(gameId);
     }
    render(){
        return (
    <div className="gameList__container">
        {this.props.games.map((game,idx)=>(
            <GameListItem
                key={idx}
                game={game}
                onJoin={()=>{this.onJoinHandler(game.gameId)}}
            />
        ))}
    </div>

        );
    }
 }
export default GameList;

