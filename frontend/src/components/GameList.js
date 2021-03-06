import React from 'react';
import GameListItem from './GameListItem';
import {Icon,Card}from 'antd';
 class GameList extends React.Component{

     onJoinHandler = (gameId)=> {
         this.props.onJoin(gameId);
     };
    render(){
        return (
    <div className="gameList__container">
        {this.props.showCreateGame ?
            <div className="gameList__item"
                 onClick={this.props.onCreateGame}
            >
                <Card
                    hoverable={true}>
                    <div
                        style={{display: 'flex', flexFlow: 'center', alignItems: 'center', role: 'button'}}
                    >
                        <Icon type="plus" style={{fontSize: 40}}/>
                        <p style={{marginLeft: '15px'}}>click to create</p>
                    </div>
                </Card>
            </div>
            : (null)
        }
        {this.props.games.map((game,idx)=>(
            <GameListItem
                key={idx}
                game={game}
                onJoin={()=>{this.onJoinHandler(game.uuid)}}
            />
        ))}
    </div>

        );
    }
 }
export default GameList;

