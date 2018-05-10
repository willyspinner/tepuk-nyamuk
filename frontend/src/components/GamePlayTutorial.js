// component that holds the game. This one connects to redux right away.
// NOTE: this is different than GamePlayPage because the logic with local state and GMS is way too different to reconcile.
import React,{Component} from 'react';
import {initializeGame,playerSlap,playerThrow,receiveMatchResult} from '../actions/gameplay';
import {connect} from 'react-redux';
import key from 'keymaster';
/*
props:
isTutorial =___ (true or false)
tutorialLevel= 1 to 10 (difficulty of tutorial - 1 is easy, 10 is difficult)

 */
class GamePlay extends Component{
    constructor(props){
        super(props);

        // key bindings
        key('t',()=>{
           alert('you threw');
        });
        key('space',()=>{
            alert('you slapped');
        })
        if(props.isTutorial === true){
            const otherplayers = ["bob","berdog","Jonathan","Mike","fool"];
            const allplayers = [props.myusername, ...otherplayers];
            const  playerinturn = this.props.myusername;
            let nhands = 10;
            const reactiontime =0.4 +  (1/ (props.tutorialLevel? props.tutorialLevel: 5)) ; // for slapping ,this is scaled by 0 to 1 (Math.random)
            const cards = [1,2,3,4,5,6,7,8,9,10,11,12,13];
            const myhand =  Array.from(Array(nhands)).map( (c) => cards[Math.floor(Math.random()*cards.length)]);
            this.state = { // our state becomes 'redis' now.
                allplayers,
                otherplayers : otherplayers.filter((player)=>player!==props.myusername).map((player)=>{
                    // each receies their own stuff.
                    return {
                        username: player,
                        hand: Array.from(Array(nhands)).map( (c) => cards[Math.floor(Math.random()*cards.length)])
                    }
                })
            }
            props.dispatch(initializeGame(
                playerinturn,
                myhand,
                allplayers,
                nhands
            ));
            // set reaction times for everyone.
            players.forEach((playerusername)=>{
                if(this.props.gameplay.match ){
                    const actualreactiontime = reactiontime * Math.random();
                    setTimeout(()=>{
                        this.props.dispatch(playerSlap(playerusername, actualreactiontime))
                    }, actualreactiontime * Math.random());
                }
                if(this.props.gameplay.playerinturn === playerusername){
                    setTimeout(()=>{
                        let popped = null;
                        let nextplayer = null;
                        this.setState((prevState)=>{
                            nextplayer = (this.state.allplayers.indexOf(playerusername) + 1 ) % (this.state.allplayers.length);
                            return {
                                ...prevState,
                                otherplayers : prevState.otherplayers.map((playerObj)=>{
                                    // each receies their own stuff.
                                    if (playerObj.username === playerusername){
                                        popped =playerObj.hand.pop();
                                        return {
                                            hand: playerObj.hand
                                        }
                                    }
                                    else
                                        return playerObj;
                                })
                            }
                        });
                        this.props.dispatch(playerThrow(playerusername,popped, nextplayer));
                    }, 1/ reactiontime);
                }

            })
        }
    }

    render () {
        return (
            <div>
                <h1> gameplay: prototype </h1>
                player turn : {this.props.gameplay.playerinturn}
                <div style={{flex: 1, flexDirection:"row"}}>
                    {this.props.gameplay.players.map((player)=>{
                        return (
                            <div>
                                {player.username}
                                <br/>
                                cards in hand: {player.nhand}
                                <br/>
                                streaks: {player.streaks}
                                <br/>
                                {player.hasslapped? "SLAPPED":null}
                                <br/>
                                {player.hasslapped? `reaction time : ${player.slapreactiontime}`:null}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
};

const mapStateToProps =(state)=>({
  gameplay: state.gameplay,
    myusername: state.user.username
});

export default connect(mapStateToProps,undefined)(GamePlay);

