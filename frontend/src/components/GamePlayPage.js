// component that holds the game. This one connects to redux right away.
import React, {Component} from 'react';
import {startPlayerThrow, startPlayerSlap, startSynchronizeGameplay, reshuffle} from '../actions/gameplay';
import {connect} from 'react-redux';
import {initializeGame,playerThrow,playerSlap,receiveMatchResult,finishGame,gameWinner} from "../actions/gameplay";
import PlayingCard from './ui/PlayingCard';
import GameplayResultsModal from './GameplayResultsModal';
import ReactLoading from 'react-loading';
import key from 'keymaster';
import {Row, Col, notification, Progress, Button, Tooltip} from 'antd';
import socketclient from '../socket/socketclient';
import {connectSocket, receiveInvitation} from "../actions/user";
import {addGame, removeGame, startedGame, startGetOpenGames} from "../actions/games";
import {receiveMessage} from "../actions/chatroom";
import AlertDialog from "./ui/AlertDialog";
import Sound from 'react-sound';
import SOUNDTYPES from '../constants/soundTypes';
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
        },
        slapped:false,
        soundUrl:'',
        timerblinking: false,
        soundPlayingStatus:Sound.status.STOPPED,
        cardsuit :'S',
        cardsuitoptions: ['S','H','C','D']
    }
    playSound= (SOUNDTYPE)=> {
        this.setState({
            soundUrl: SOUNDTYPE,
            soundPlayingStatus: Sound.status.STOPPED
        });
        this.setState({
            soundUrl: SOUNDTYPE,
            soundPlayingStatus: Sound.status.PLAYING
        })
    }
    throw = () => {
        console.log('pressed throw');
        if (this.props.gameplay.playerinturn === this.props.myusername) {
            if(!this.props.gameplay.match) {
                this.props.dispatch(startPlayerThrow()).catch((e) => {
                    //synchronize here.
                    console.log('NOTE: going to synchronize because of :', e);
                    this.props.dispatch(startSynchronizeGameplay());
                });
            }
        }else{
            console.log('it isn\'t your turn ting.');
            console.log('playerinturn: ',this.props.gameplay.playerinturn,'myusername: ',this.props.myusername)

            notification.error({
                message: "it isn't your turn!",
                description:"you can't throw a card when it isn't your turn.",
                duration: '2'
            });
        }
    };
    // method for me slapping.
    slap = () => {
        if(this.props.gameplay.pile.length === 0){
            notification.error({
                message:'What are you slapping for?',
                description:"there aren't any cards on the pile...",
                duration: 3
            })
        }
        if (!this.props.gameplay.match) {
            this.props.dispatch(startPlayerSlap(123059123))
        }else{
            this.props.dispatch(startPlayerSlap(performance.now() - this.state.myreactiontime)).catch((e)=>{

            })
        }
        this.setState({
            slapped:true
        })
        this.playSound(SOUNDTYPES.gameplay.slapped);
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
            this.setState(prevState=>({ cardsuit: prevState.cardsuitoptions[this.props.gameplay.pile.length % prevState.cardsuitoptions.length ] }))
            this.playSound(SOUNDTYPES.gameplay.threw);
            if (nextTick.reshuffle){
                this.props.dispatch(reshuffle(nextTick.reshuffle,nextTick.newpile));
                const description="All hands are 0. Reshuffling...";
                notification.open({
                    message:'reshuffle',
                    description,
                    duration: 3
                })

            }
        };
        const onMatchResult= (result)=>{
            this.determineLoser(result.loser,result.isAccidental);
            this.props.dispatch(receiveMatchResult(
                result.loser,
                result.loserAddToPile,
                result.nextplayer,
                result.streakUpdate,
                result.scoreUpdate,
            ));
            this.setState({
                slapped:false
            })
        };
        const onGameStart = (onrealgamestartobj)=>{
            this.props.dispatch(initializeGame(
                onrealgamestartobj.playerinturn,
                onrealgamestartobj.players,
                onrealgamestartobj.nhand,
            ));
            //initiate timer.
            this.setState({timelimitsecs: onrealgamestartobj.timelimitsecs, initialtimelimitsecs: onrealgamestartobj.timelimitsecs});
            const timer =setInterval(()=>{this.setState((prevState)=>{
                if (prevState.timelimitsecs < (1/3) * prevState.initialtimelimitsecs){
                    return{timelimitsecs:( prevState.timelimitsecs -1 )<0? 0: prevState.timelimitsecs - 1, timerblinking: !prevState.timerblinking}
                }
                else
                return{timelimitsecs:( prevState.timelimitsecs -1 )<0? 0:  prevState.timelimitsecs - 1};
            })},1000);
            this.setState({countdowntimer : timer});
        };
        const onGameWinnerAnnounced = (gameFinishedObj)=>{
            this.props.dispatch(gameWinner(gameFinishedObj));
            clearInterval(this.state.countdowntimer);
            key.unbind('t');
            key.unbind('space');
            notification.destroy();
            this.setState({isShowingResultsModal:true});
        };
        //clear previous gameplay object.
        this.props.dispatch(finishGame());
        socketclient.disconnectAppcsAndConnectToGameplay(this.props.location.gamestartobj,
            this.props.myusername,
            onPlayerSlapRegistered,
            onNextTick,
            onMatchResult,onGameStart,onGameWinnerAnnounced).then(()=>{
                // bind key bindings only when we subscribed to the gameplay and everything ok...
                key('t', () => {
                        this.throw();
                });
                key('space', () => {
                    this.slap();
                })
        });
    }

    determineLoser = (loserusername,isaccidental) => {
        const description = isaccidental? `Loser is: ${loserusername}, who slapped accidentally!! :(`:
             `Loser is : ${loserusername}, who slapped in time: ${this.props.gameplay.players.filter((player)=>player.username === loserusername)[0].slapreactiontime}`;
        notification.info({
            message:'Match results',
            description,
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
        const connectionStr = `http://${process.env.API_HOST}:${process.env.API_PORT}`;
        //TODO: differentiate between appcs and gms here.
        socketclient.connect(connectionStr, this.props.user.token,undefined,'appcs').then((socketid) => {
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
    synchronize=()=>{
        console.log('trying to synchronize gameplay...')
        this.props.dispatch(startSynchronizeGameplay()).then((res)=>{
            notification.success({
                message: "synchronization successful.",
                description:`${JSON.stringify(res)}`,
                duration: '5'
            })
        }).catch((e)=>{
            notification.error({
                message: "synchronization failed.",
                description:`${JSON.stringify(res)}`,
                duration: '5'
            })
        })
    }
    render() {
            const num =this.props.gameplay && this.props.gameplay.counter?  ((parseInt(this.props.gameplay.counter) - 1) % 13) + 1 : undefined;
            let realnum = undefined;
            if (num){
                switch (num){
                    case 11:
                        realnum = 'J';
                        break;
                    case 12:
                        realnum = 'Q'
                        break;
                    case 13:
                        realnum = 'K'
                        break;
                    case 1:
                        realnum = 'A'
                        break;
                    default:
                        realnum=num;
                }
            }
        return (

            <div>
                {/* modals */}
                <AlertDialog
                isShowingModal={this.state.error.showErrorModal}
                handleClose={() => this.setState({error: {showErrorModal: false}})}
                subject={this.state.error.subject}
                message={this.state.error.message}
                />
                <Sound
                    url={this.state.soundUrl}
                    playStatus={this.state.soundPlayingStatus}
                    onFinishedPlaying={()=>this.setState({soundPlayingStatus:Sound.status.STOPPED})}
                />
                <GameplayResultsModal
                    isOpen={this.state.isShowingResultsModal}
                    onGoBackToHome={this.goBackToHome}
                />
                {this.props.gameplay && this.props.gameplay.initialized ?
                    <div>
                        <p className="game_font" style={{color:this.state.timerblinking? 'red':'black',fontSize: '30px'}}> {Math.floor(this.state.timelimitsecs/60)}:{this.state.timelimitsecs % 60 <10? '0':null}{this.state.timelimitsecs % 60}</p>
                        <h4>it is {this.props.gameplay.playerinturn}{this.props.gameplay.playerinturn.endsWith('s')? "'":"'s"} turn.</h4>
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
                                                <p> score: {Math.round(player.score)} </p>
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
                                <Button onClick={this.throw} style={{margin:'5px 5px 5px 5px'}}>
                                    throw
                                </Button>
                                    <Button onClick={this.slap} style={{margin:'5px 5px 5px 5px'}}>
                                    slap
                                </Button>
                                <Tooltip placement="top" title={"Press this button when your gameplay state is out of sync."}>
                                <Button onClick={this.synchronize} style={{margin:'5px 5px 5px 5px'}}>
                                  synchronize
                                </Button>
                                </Tooltip>
                                {this.props.gameplay.pile.length === 0 ? (<p>{this.props.gameplay.playerinturn}, throw the card to continue...`</p>) :
                                    (
                                        <PlayingCard
                                            suit={this.state.cardsuit}
                                            number={this.props.gameplay.pile[this.props.gameplay.pile.length - 1]}
                                            hasSlapped={this.state.slapped}
                                        />
                                    )
                                }
                            </Col>
                            <Col span={8}>
                        <span className={"showCounter"}>
                        <p className={"game_font"} style={{fontSize:'135px', textAlign:'center'}}> {
                            realnum
                        }</p>
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
