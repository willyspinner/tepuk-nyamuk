// component that holds the game. This one connects to redux right away.
import React, {Component} from 'react';
import {startPlayerThrow, startPlayerSlap, startSynchronizeGameplay, reshuffle} from '../actions/gameplay';
import {connect} from 'react-redux';
import {initializeGame,playerThrow,playerSlap,receiveMatchResult,finishGame,gameWinner} from "../actions/gameplay";
import GameplayResultsModal from './GameplayResultsModal';
import ReactLoading from 'react-loading';
import key from 'keymaster';
import {Row, Col, notification, Progress, Button, Tooltip,  Switch} from 'antd';
import socketclient from '../socket/socketclient';
import { removeGame } from "../actions/games";
import AlertDialog from "./ui/AlertDialog";
import Sound from 'react-sound';
import SOUNDTYPES from '../constants/soundTypes';
import GamePlayComponent from "./GamePlayComponent";
class GamePlayPage extends Component {
    // method for me throwing.
    state={
        isShowingResultsModal :false,
        error:{
            showErrorModal: false,
            subject:'',
            message:''
        },
        soundOn: true,
        slapped:false,
        soundUrl:'',
        timerblinking: false,
        soundPlayingStatus:Sound.status.STOPPED,
        cardsuit :'S',
        cardsuitoptions: ['S','H','C','D'],
        bgcolor: 'white',
        redbgcolor : 'rgba(255, 62, 23, 0.58)'
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
            notification.destroy();
            notification.error({
                message: "it isn't your turn!",
                description:"you can't throw a card when it isn't your turn.",
                duration: '1'
            });
        }
    };
    // method for me slapping.
    slap = () => {
        if(this.props.gameplay.pile.length === 0){
            notification.destroy();
            notification.error({
                message:'What are you slapping for?',
                description:"there aren't any cards on the pile...",
                duration: 1
            })
            return;
        }
        if(this.state.slapped)
            return;
        if (!this.props.gameplay.match) {
            this.props.dispatch(startPlayerSlap(123059123))
        }else{
            const elapsed_time = performance.now() -  this.state.myreactiontime;
            console.log(`this.state.myreactiontime : ${this.state.myreactiontime}`);
            console.log(`elapsed time slap : ${elapsed_time}`);
            this.props.dispatch(startPlayerSlap(elapsed_time)).catch((e)=>{

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
                    duration: 1
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
                slapped:false,
                loser: result.loser,
            });
            let timeout = setTimeout(()=>{
                this.setState({loser: ""});
                clearTimeout(timeout);
            },500);
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
                if( prevState.timelimitsecs <= 0)
                    clearInterval(this.state.countdowntimer);
                if (prevState.timelimitsecs < (1/4) * prevState.initialtimelimitsecs){
                    return{timelimitsecs:( prevState.timelimitsecs -1 )<0? 0: prevState.timelimitsecs - 1, timerblinking: true /*!prevState.timerblinking*/}
                }
                else
                return{timelimitsecs:( prevState.timelimitsecs -1 )<0? 0:  prevState.timelimitsecs - 1};
            })},1000);
            this.setState({countdowntimer : timer});
        };
        const onGameWinnerAnnounced = (gameFinishedObj)=>{
            this.props.dispatch(gameWinner(gameFinishedObj));
            notification.destroy();
            this.setState({
                isShowingResultsModal:true,
                timerblinking:false
            });
        };
        const onGameInterrupt = ()=>{
            //go back.
            notification.destroy();
            this.goBackToHome("error");
        }
        //clear previous gameplay object.
        this.props.dispatch(finishGame());
        socketclient.disconnectAppcsAndConnectToGameplay(this.props.location.gamestartobj,
            this.props.myusername,
            onPlayerSlapRegistered,
            onNextTick,
            onMatchResult,onGameStart,onGameWinnerAnnounced,onGameInterrupt).then(()=>{
                // bind key bindings only when we subscribed to the gameplay and everything ok...
                key('t', () => {
                        this.throw();
                });
                key('space', () => {
                    this.slap();
                })
        }).catch((e)=>{
            this.setState({isError:true},()=>{
                this.alertError('Error',"Sorry. You can't join this game. Please go back to the home page.");
            });
        });
    }
    componentWillUnmount(){
        console.log("clearing interval timer");
        clearInterval(this.state.countdowntimer);
        key.unbind('t');
        key.unbind('space');
    }
    determineLoser = (loserusername,isaccidental) => {
        const description = isaccidental? `Loser is: ${loserusername}, who slapped accidentally!! :(`:
             `Loser is : ${loserusername}, who slapped in time: ${this.props.gameplay.players.filter((player)=>player.username === loserusername)[0].slapreactiontime}`;
        notification.destroy();
        notification.info({
            message:'Match results',
            description,
            duration: 1
        })
        if(loserusername === this.props.user.username){
            this.setState({bgcolor: this.state.redbgcolor})
            setTimeout(()=>this.setState({bgcolor: 'white'}),220);
            setTimeout(()=>this.setState({bgcolor: this.state.redbgcolor}),440);
            setTimeout(()=>this.setState({bgcolor: 'white'}),600);
        }else{
            const color = 'rgba(25, 252, 19, 0.51)';
            this.setState({bgcolor: color})
            setTimeout(()=>this.setState({bgcolor: 'white'}),650);
        }
    };

    componentDidUpdate(prevProps, prevState) {
        /*
        if (this.props.gameplay.players.filter((player) => player.hasslapped === false).length === 0) {
            // MATCH RESULT
            this.determineLoser();
            return;
        }
        */

        if ( this.props.gameplay.pile && prevProps.gameplay.pile && prevProps.gameplay.pile.length !== this.props.gameplay.pile.length) {
            if (this.props.gameplay.match) {
                this.setState({myreactiontime: performance.now()},()=> {
                });
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
    goBackToHome = (errormsg)=>{
        socketclient.close();
                //remove our finished game.
                this.props.dispatch(removeGame(this.props.user.gameid));
                //remove our gameplay object.
                this.props.dispatch(finishGame());

                if (errormsg === 'error'){
                    this.setState({isdisconnected:true},()=>{
                        this.props.history.push({
                            pathname: '/',
                            dialog: {
                                subject: 'Sorry!',
                                message: 'Someone disconnected from gameplay. Please don\'t leave games midway! '
                            },
                            needConnect: true,

                        });
                    })
                }
                else
                    this.props.history.push({
                        pathname: '/',
                        needConnect: true,
                        expUpdate: true
                    });
}
    synchronize=()=>{
        console.log('trying to synchronize gameplay...')
        this.props.dispatch(startSynchronizeGameplay()).then((res)=>{
            notification.destroy();
            notification.success({
                message: "synchronization successful.",
                description:`${JSON.stringify(res)}`,
                duration: '1'
            })
        }).catch((e)=>{
            notification.destroy();
            notification.error({
                message: "synchronization failed.",
                description:`${JSON.stringify(res)}`,
                duration: '1'
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

            <div style={{background:this.state.bgcolor}}>
                {/* modals */}
                <AlertDialog
                isShowingModal={this.state.error.showErrorModal}
                handleClose={() => this.setState({error: {showErrorModal: false}})}
                subject={this.state.error.subject}
                message={this.state.error.message}
                >
                    <Button style={{margin: "auto"}} onClick={
                        ()=>{
                            this.props.history.push("/");
                        }
                    }>
                        Go back to Home
                    </Button>
                </AlertDialog>
                <GameplayResultsModal
                    isOpen={this.state.isShowingResultsModal}
                    onGoBackToHome={this.goBackToHome}
                />
                <Sound
                    url={this.state.soundUrl}
                    playStatus={this.state.soundPlayingStatus}
                    onFinishedPlaying={()=>this.setState({soundPlayingStatus:Sound.status.STOPPED})}
                    volume={this.state.soundOn? 100:0}
                />
                <Sound
                    url={SOUNDTYPES.gameplay.tikTok}
                    playStatus={this.state.timerblinking && !this.state.isShowingResultsModal? Sound.status.PLAYING: Sound.status.STOPPED}
                    loop={this.state.timerblinking && !this.state.isShowingResultsModal? true:false}
                    volume={this.state.soundOn? 100:0}
                />
                <GameplayResultsModal
                    isOpen={this.state.isShowingResultsModal}
                    onGoBackToHome={this.goBackToHome}
                />
                {this.props.gameplay && this.props.gameplay.initialized ?
                    <div style={{paddingRight: "10px", paddingLeft:'10px'}}>
                        <div style={{display:'flex',flexDirection: 'row', justifyContent:'space-between'}}>
                            <p className="game_font" style={{color:this.state.timerblinking? 'red':'black',fontSize: '30px' }}>
                                {Math.floor(this.state.timelimitsecs/60)}:{this.state.timelimitsecs % 60 <10? '0':null}{this.state.timelimitsecs % 60}
                            </p>
                            <div style={{display:'flex', flexDirection:'row'}}>
                                <p> Sound: </p>
                            <Switch checkedChildren="on" unCheckedChildren="mute"
                                    checked={this.state.soundOn}
                                    style={{marginLeft: '15px'}}
                                onChange={(checked)=>this.setState({soundOn: checked})}
                            />
                            </div>

                        </div>
                        <GamePlayComponent
                            gameplay={this.props.gameplay}
                            cardsuit={this.state.cardsuit}
                            slapped={this.state.slapped}
                            loser={this.state.loser}
                            isError={this.state.error}
                            realnum={realnum}
                            throw={this.throw}
                            slap={this.slap}
                            synchronize={this.synchronize}
                        />
                    </div>
                    :
                        (

                            <div style={{margin: '0 auto' ,display:'flex',flexDirection:'column',alignItems:'center'}}>
                                {!this.state.isError?
                                    <span>
                                <ReactLoading type={"cylon"} color={"blue"} height={300} width={180}/>
                                <h1> joining game...</h1>
                                    </span>
                                    :null}
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
