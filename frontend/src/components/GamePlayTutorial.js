// component that holds the game. This one connects to redux right away.
// NOTE: this is different than GamePlayPage because the logic with local state and GMS is way too different to reconcile.
import React,{Component} from 'react';
import {playerSlap,playerThrow,receiveMatchResult,finishGame} from '../actions/gameplay';
import {connect} from 'react-redux';
import PlayingCard from './ui/PlayingCard';
import key from 'keymaster';
import {Row,Col} from 'antd';
/*
props:
tutorialLevel= 1 to 10 (difficulty of tutorial - 1 is easy, 10 is difficult)

 */
class GamePlayTutorial extends Component{
    // methods for this tutorial only.
    throw= (username)=>{
        let poppedcard = null;
        this.setState((prevState)=>{
            return {
                // slap: prevState.slap + 1,
                allplayers: this.state.allplayers.map((player)=>{
                    if(player.username === username){
                        console.log(`popping for:${player.username}`);
                        poppedcard = player.hand.pop();
                        return {
                            username,
                            hand: player.hand,
                        }
                    }
                    else
                        return player;
                })
            }
        });
        let nextplayer = this.state.allplayers[(this.state.allplayers.map((player)=>player.username).indexOf(username) + 1) % this.state.allplayers.length].username;
        this.props.dispatch(playerThrow(username,poppedcard, nextplayer));

    };
    slap = (username,reactiontime)=>{
        this.props.dispatch(playerSlap(username, reactiontime))
    };
    constructor(props){
        super(props);
        //state
        let nhands = this.props.nhands;
        let allplayers = this.props.allplayers;
        const cards = [1,2,3,4,5,6,7,8,9,10,11,12,13];
        this.state = { // GamePlayTutorial's state becomes 'redis' now.
            allplayers : allplayers.map((player)=>{
                // each receies their own stuff.
                return {
                    username: player,
                    hand: Array.from(Array(nhands)).map( (c) => cards[Math.floor(Math.random()*cards.length)])
                }
            })
        };

        // key bindings
        key('t',()=>{
            if( this.props.gameplay.playerinturn === this.props.myusername){
                this.throw(this.props.myusername);
            }else{
                alert("it isn't your turn!");
            }
        });
        key('space',()=>{
            if(!this.props.gameplay.match){
                this.slap(this.props.myusername,123091); // you just slapped mistakenly.
                alert(`oh no! despite not being a match event, you slapped! you received ${this.props.gameplay.pile.length} cards.`);
                this.determineLoser();
            }
            this.slap(this.props.myusername, performance.now() - this.state.myreactiontime);
        })
            // set reaction times for other players.
    }
    determineLoser= ()=>{
        let loser = undefined;
        this.props.gameplay.players.forEach((player)=>{
            if(!loser)
                loser= player;
            else
            if(loser.slapreactiontime < player.slapreactiontime)
                loser = player;
        });
        
        console.log(`got loser ${loser.username} out of ${JSON.stringify(this.props.gameplay.players.map((player)=>player.username))}`);
        let addtopile = this.props.gameplay.pile.length;
        this.props.dispatch(receiveMatchResult(loser.username,addtopile));
        alert(`after slap event: loser: ${JSON.stringify(loser)}`);
        //TODO: not sure if putting the below works.
        //TODO: this is a sketchy way to alleviate the problem. seriosuly. ew
        // eh. whatever. This isn't the REAL game implementation anyway.
        setTimeout(()=>this.updateThrowHandler,1000);
    };
    // used for the other bot players to check whether they should throw.
    updateThrowHandler = () => {
        console.log(`GPT: updateThrowHandler called.`);
        const reactiontime =3 +  (1/ (this.props.tutorialLevel? this.props.tutorialLevel: 5)) ; // for slapping ,this is scaled by 0 to 1 (Math.random)
        this.state.allplayers.forEach((player)=>{
            if(player.username === this.props.myusername)
                return;
            if(this.props.gameplay.match ){
                const actualreactiontime = reactiontime * Math.random() * 1000;

                console.log(`${player.username} detected match event ${this.props.gameplay.match}`);
                setTimeout(()=>{
                    this.slap(player.username,actualreactiontime)
                }, actualreactiontime);
                return;
            }
            if(this.props.gameplay.playerinturn === player.username){
                setTimeout(()=>{
                    this.throw(player.username);
                }, (1/ reactiontime) * 2700);
            }
        });
    };
    componentWillUnmount(){
        // this is needed.
        this.props.dispatch(finishGame());
    }
componentDidUpdate(prevProps,prevState){
        if(this.props.gameplay.players.filter((player)=>player.hasslapped === false).length ===0){
            // MATCH RESULT
            this.determineLoser();
            return;
        }
        if(prevProps.gameplay.playerinturn !== this.props.gameplay.playerinturn){
            if(this.props.gameplay.match ){
                this.setState({myreactiontime: performance.now()})
            }
        this.updateThrowHandler();
        }
}
    render () {

        return (
            <div>
                <h1> gameplay: prototype </h1>
                player turn : {this.props.gameplay.playerinturn}
                <Row type="flex" justify="center" align="top">
                    <Col span={8}>
                        <div style={{flex: 1, flexDirection:"row"}}>
                            {this.props.gameplay.players.map((player,idx)=>{
                                return (
                                    <div key ={idx}>
                                        <h3>{player.username}</h3>
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
                    </Col>
                    <Col span={8}>
                        {this.props.gameplay.pile.length ===0 ?"throw the card to continue...":
                            (
                            <PlayingCard
                                suit={"S"}
                                number={this.props.gameplay.pile[this.props.gameplay.pile.length -1]}
                            />
                            )
                        }
                    </Col>
                    <Col span={8}>
                        <span className={"showCounter"}>
                        <h1>counter: {((parseInt(this.props.gameplay.counter) - 1)  % 13 )+ 1 }</h1>
                        </span>
                    </Col>
                </Row>
            </div>
        );
    }
}

const mapStateToProps =(state)=>({
  gameplay: state.gameplay,
    myusername: state.user.username
});

export default connect(mapStateToProps,undefined)(GamePlayTutorial);

