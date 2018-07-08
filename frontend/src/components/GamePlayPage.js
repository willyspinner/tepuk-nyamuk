// component that holds the game. This one connects to redux right away.
import React, {Component} from 'react';
import {startPlayerThrow, startPlayerSlap} from '../actions/gameplay';
import {connect} from 'react-redux';
import {initializeGame,playerThrow,playerSlap,receiveMatchResult,finishGame,gameWinner} from "../actions/gameplay";
import PlayingCard from './ui/PlayingCard';
import GameplayResultsModal from './GameplayResultsModal';
import ReactLoading from 'react-loading';
import key from 'keymaster';
import {Row, Col,notification,Progress} from 'antd';
import socketclient from '../socket/socketclient';
import {connectSocket, receiveInvitation} from "../actions/user";
import {addGame, removeGame, startedGame, startGetOpenGames} from "../actions/games";
import {receiveMessage} from "../actions/chatroom";
import AlertDialog from "./ui/AlertDialog";

/*
props:
tutorialLevel= 1 to 10 (difficulty of tutorial - 1 is easy, 10 is difficult)

 */
class GamePlayPage extends Component {
    // method for me throwing.
    state={
        isShowingResultsModal :false,
        error:{
            showErrorModal: false,
            subject:'',
            message:''
        }
    }
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
            this.determineLoser();
            this.props.dispatch(receiveMatchResult(
                result.loser,
                result.loserAddToPile,
                result.nextplayer,
                result.streakUpdate
            ));
        };
        const onGameStart = (onrealgamestartobj)=>{
            this.props.dispatch(initializeGame(onrealgamestartobj.playerinturn,
                onrealgamestartobj.players,
                onrealgamestartobj.nhand));
        };
        const onGameWinnerAnnounced = (gameFinishedObj)=>{
            this.props.dispatch(gameWinner(gameFinishedObj));
            this.setState({isShowingResultsModal:true});
        }
        socketclient.subscribeToGameplay(this.props.location.gamestartobj,
            this.props.myusername,
            onPlayerSlapRegistered,
            onNextTick,
            onMatchResult,onGameStart,onGameWinnerAnnounced).then(()=>{
                // bind key bindings only when we subscribed to the gameplay and everything ok...
                key('t', () => {
                    if (this.props.gameplay.playerinturn === this.props.myusername) {
                        this.throw();
                    } else {
                        notification.open({
                            message: "it isn't your turn!",
                            description:"you can't throw a card when it isn't your turn.",
                            duration: '2'
                        });
                    }
                });
                key('space', () => {
                    if (!this.props.gameplay.match) {
                        this.slap(123012091); // you just slapped mistakenly.
                        /*
                        notification.open({
                            message:'oops!',
                            description:`oh no! despite not being a match event, you slapped! you received ${this.props.gameplay.pile.length} cards.`
                        })
                        */
                    }else{
                        this.slap(performance.now() - this.state.myreactiontime);
                    }
                })
        });
    }

    determineLoser = () => {
        let loser = undefined;
        console.log(`called determineLoser. players: ${JSON.stringify(this.props.gameplay.players)}`);
        this.props.gameplay.players.forEach((player) => {
            if (!loser)
                loser = player;
            else if (loser.slapreactiontime < player.slapreactiontime)
                loser = player;
        });

        console.log(`got loser ${loser.username} out of ${JSON.stringify(this.props.gameplay.players.map((player) => player.username))}`);
        notification.open({
            message:'Match results',
            description: `Loser is : ${loser.username}, who slapped in time: ${loser.slapreactiontime}`,
            duration: 3
        })
    };

    componentDidUpdate(prevProps, prevState) {
        /*
        if (this.props.gameplay.players.filter((player) => player.hasslapped === false).length === 0) {
            // MATCH RESULT
            this.determineLoser();
            return;
        }
        */
        if (prevProps.gameplay.playerinturn !== this.props.gameplay.playerinturn) {
            if (this.props.gameplay.match) {
                this.setState({myreactiontime: performance.now()})
            }
        }
    }
    alertError(subject, message) {
        this.setState({
            error: {
                showErrorModal: true,
                subject,
                message
            }
        })
    }
    goBackToHome = ()=>{
        //TODO ELEGANT: this method is an exact duplicate of the one in mainpage (connectToGameUpdates).
        // TODO: maybe abstract both away?
        // e.g. make a socketclient method which is simpler for both to call?
        socketclient.close();
        const connectionStr = `http://${process.env.APPCS_HOST}:${process.env.APPCS_PORT}`;
        socketclient.connect(connectionStr, this.props.user.token).then((socketid) => {
            this.props.dispatch(connectSocket(socketid));
            this.props.dispatch(startGetOpenGames()).then(() => {
                socketclient.subscribeToMainPage(
                    (newGame) =>
                        this.props.dispatch(addGame(newGame)),
                    (deletedGameuuid) =>
                        this.props.dispatch(removeGame(deletedGameuuid)),
                    (newMessageObj) =>
                        this.props.dispatch(receiveMessage(newMessageObj)),
                    (onGameStarted) =>
                        this.props.dispatch(startedGame(onGameStarted.gameuuid))
                    ,
                    (invitation)=>
                        this.props.dispatch(receiveInvitation(invitation))
                );
                //remove our finished game.
                this.props.dispatch(removeGame(this.props.user.gameid));
                //remove our gameplay object.
                this.props.dispatch(finishGame());

                this.props.history.push({
                    pathname: '/'
                });
            }).catch((e) => {
                this.alertError('server error. Sorry!',
                    `couldn't get open games. Server error. Please try again later. ${e}`
                );
            });
        }).catch((e) => {
            this.alertError(
                'server error. Sorry!',
                `couldn't connect to socket for live updates. Please try again later. ${e}`
            );
        })
}
    render() {

        return (

            <div>
                {/* modals */}
                <AlertDialog
                isShowingModal={this.state.error.showErrorModal}
                handleClose={() => this.setState({error: {showErrorModal: false}})}
                subject={this.state.error.subject}
                message={this.state.error.message}
                />
                <GameplayResultsModal
                    isOpen={this.state.isShowingResultsModal}
                    onGoBackToHome={this.goBackToHome}
                />
                {this.props.gameplay && this.props.gameplay.initialized ?
                    <div>
                        <h1> gameplay: prototype </h1>
                        <h4>player turn : {this.props.gameplay.playerinturn}</h4>

                        <h4>
                            whoami : {this.props.myusername}
                        </h4>
                        <div>
                            {/* Pile */}
                            <h2>Pile:</h2>
                            <Progress
                                percent ={
                                    (this.props.gameplay.pile.length /(
                                        this.props.gameplay.pile.length +
                                        this.props.gameplay.players.map((player)=>player.nhand).reduce((acc,cur)=>acc+cur) ))* 100}
                                format={()=>`pile: ${this.props.gameplay.pile.length}`}
                                status={this.props.gameplay.pile.length > 13? 'exception':'active'}
                            />

                        </div>
                        <Row type="flex" justify="center" align="top">
                            <Col span={8}>
                                <div style={{flex: 1, flexDirection: "row"}}>
                                    {this.props.gameplay.players.map((player, idx) => {
                                        return (
                                            <div key={idx}>
                                                <h2>{player.username}</h2>
                                                <p> cards in hand: {player.nhand} </p>
                                                <Progress
                                                    type="circle"
                                                      status={player.streak >= 3? 'success': 'active'}
                                                      percent={player.streak * 33.33333}
                                                      format={percent => `${player.streak} streak${player.streak > 1 ? 's':''}`}/>
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
                                {this.props.gameplay.pile.length === 0 ? `${this.props.gameplay.playerinturn}, throw the card to continue...` :
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

                            <div style={{margin: '0 auto'}}>
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
    myusername: state.user.username,
    user: state.user
});

export default connect(mapStateToProps, undefined)(GamePlayPage);
