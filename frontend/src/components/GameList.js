import React from 'react';
import {connect} from 'react-redux';
import GameListItem from './GameListItem';
 const GameList = (props)=> (
    <div>
        {props.games.map(game=>(
            <GameListItem game={game}/>
        ))}
    </div>
);
 const mapStateToProps = (state)=>({
     games:state.games
 });
export default connect(mapStateToProps)(GameList);

