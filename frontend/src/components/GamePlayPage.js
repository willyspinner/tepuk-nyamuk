// component that holds the game. This one connects to redux right away.
import React, {Component} from 'react';
import {startPlayerThrow, startPlayerSlap} from '../actions/gameplay';
import {connect} from 'react-redux';
import {initializeGame,playerThrow,playerSlap,receiveMatchResult} from "../actions/gameplay";
import PlayingCard from './ui/PlayingCard';
import ReactLoading from 'react-loading';
import key from 'keymaster';
import {Row, Col} from 'antd';
import socketclient from '../socket/socketclient';

/*
props:
tutorialLevel= 1 to 10 (difficulty of tutorial - 1 is easy, 10 is difficult)

 */
class GamePlayPage extends Component {
    // method for me throwing.
    throw = () => {
        this.props.dispatch(startPlayerThrow());
    };
    // method for me slapping.
    slap = (reactiontime) => {
        this.props.dispatch(startPlayerSlap(reactiontime))
    };

    constructor(props) {
        super(props);
        // PUT CONNECT TO GAME UPDATES HERE.
        const onPlayerSlapRegistered = (data)=>{
            this.props.dispatch(playerSlap(data.username, data.reactiontime));
        };
        const onNextTick= (nextTick)=>{
            this.props.dispatch(playerThrow(
                nextTick.playerthrew,
                nextTick.piletop,
                nextTick.nextplayer,
                nextTick.match
            ));
        };
        const onMatchResult= (result)=>{
            this.props.dispatch(receiveMatchResult(
                result.loser,
                result.loserAddToPile,
                result.nextplayer,
            ));
        };
        const onGameStart = (onrealgamestartobj)=>{
            this.props.dispatch(initializeGame(onrealgamestartobj.playerinturn,
                onrealgamestartobj.players,
                onrealgamestartobj.nhand));
        };
        socketclient.subscribeToGameplay(this.props.location.gamestartobj,
            this.props.myusername,
            onPlayerSlapRegistered,
            onNextTick,
            onMatchResult,onGameStart).then(()=>{
                // bind key bindings only when we subscribed to the gameplay and everything ok...
                key('t', () => {
                    if (this.props.gameplay.playerinturn === this.props.myusername) {
                        this.throw();
                    } else {
                        alert("it isn't your turn!");
                    }
                });
                key('space', () => {
                    if (!this.props.gameplay.match) {
                        this.slap(123091); // you just slapped mistakenly.
                        alert(`oh no! despite not being a match event, you slapped! you received ${this.props.gameplay.pile.length} cards.`);
                        this.determineLoser();
                    }
                    this.slap(performance.now() - this.state.myreactiontime);
                })
        });
    }

    determineLoser = () => {
        let loser = undefined;
        this.props.gameplay.players.forEach((player) => {
            if (!loser)
                loser = player;
            else if (loser.slapreactiontime < player.slapreactiontime)
                loser = player;
        });

        console.log(`got loser ${loser.username} out of ${JSON.stringify(this.props.gameplay.players.map((player) => player.username))}`);
        alert(`after slap event: loser: ${JSON.stringify(loser)}`);
    };

    componentDidUpdate(prevProps, prevState) {
        if (this.props.gameplay.players.filter((player) => player.hasslapped === false).length === 0) {
            // MATCH RESULT
            this.determineLoser();
            return;
        }
        if (prevProps.gameplay.playerinturn !== this.props.gameplay.playerinturn) {
            if (this.props.gameplay.match) {
                this.setState({myreactiontime: performance.now()})
            }
        }
    }

    render() {

        return (
            <div>
                {this.props.gameplay && this.props.gameplay.initialized ?
                    <div>
                        <h1> gameplay: prototype </h1>
                        <h4>player turn : {this.props.gameplay.playerinturn}</h4>

                        <h4>
                            whoami : {this.props.myusername}
                        </h4>
                        <Row type="flex" justify="center" align="top">
                            <Col span={8}>
                                <div style={{flex: 1, flexDirection: "row"}}>
                                    {this.props.gameplay.players.map((player, idx) => {
                                        return (
                                            <div key={idx}>
                                                <h3>{player.username}</h3>
                                                <br/>
                                                cards in hand: {player.nhand}
                                                <br/>
                                                streaks: {player.streaks}
                                                <br/>
                                                {player.hasslapped ? "SLAPPED" : null}
                                                <br/>
                                                {player.hasslapped ? `reaction time : ${player.slapreactiontime}` : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Col>
                            <Col span={8}>
                                {this.props.gameplay.pile.length === 0 ? "throw the card to continue..." :
                                    (
                                        <PlayingCard
                                            suit={"S"}
                                            number={this.props.gameplay.pile[this.props.gameplay.pile.length - 1]}
                                        />
                                    )
                                }
                            </Col>
                            <Col span={8}>
                        <span className={"showCounter"}>
                        <h1>counter: {((parseInt(this.props.gameplay.counter) - 1) % 13) + 1}</h1>
                        </span>
                            </Col>
                        </Row>
                    </div>
                    :
                        (

                            <div>
                                <ReactLoading type={"cylon"} color={"blue"} height={300} width={180}/>
                                <h1> joining game...</h1>
                            </div>
                        )

                }
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    gameplay: state.gameplay,
    myusername: state.user.username
});

export default connect(mapStateToProps, undefined)(GamePlayPage);
