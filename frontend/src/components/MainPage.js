import React, {Component} from 'react';
import GameList from './GameList';

class MainPage extends Component {

render (){

    return (
    <div>
        Main page here.
        You should be able to :
        -> See the list of open games (not in progress yet)
        -> join open games
        -> create own game
        <GameList/>
    </div>
    );
}
}

export default MainPage;
