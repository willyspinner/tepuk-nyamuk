import React from 'react';
import {connect} from 'react-redux';
import GameListItem from './GameListItem';

const onJoinHandler = (gameid)=> {
    alert(`joining ${gameid}`);
}
 const GameList = (props)=> (
    <div className="gameList__container">
        {props.games.map((game,idx)=>(
            <GameListItem
                key={idx}
                game={game}
                onJoin={()=>{onJoinHandler(game.gameId)}}
            />
        ))}
    </div>
);
 const mapStateToProps = (state)=>({
     games:state.games
 });
export default connect(mapStateToProps)(GameList);

