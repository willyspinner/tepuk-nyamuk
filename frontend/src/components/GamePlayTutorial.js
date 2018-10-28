// component that holds the game. This one connects to redux right away.
// NOTE: this is different than GamePlayPage because the logic with local state and GMS is way too different to reconcile.
import React,{Component} from 'react';
import key from 'keymaster';
import GamePlayComponent from "./GamePlayComponent";
import ReactLoading from "react-loading"
import Joyride from 'react-joyride';
import {Button} from "antd";
/*
props:
myusername
onComplete - what to do when tutorial completed.
 */

/* format of each stage.:
target: CSS selector for which one to point at.
content: text to put
placement: "top or bottom, or left or right.

 */

class GamePlayTutorial extends Component{
    // methods for this tutorial only.
    state={
        slapped: false,
        gameplay: {
            counter:undefined,
            initialized:true,
            playerinturn:this.props.myusername,
            playerinturnidx: 0,
            pile:[],
            cardPop: [10, 8, "K", "A", 9, 2, 7, 6, 8],
            match:false,
            players: [
                {"username":this.props.myusername, "nhand":10,"streak":0,"hasslapped":false,"score":0},
                {"username":"Wilson","nhand":10,"streak":0,"hasslapped":false,"score":0},
                {"username":"Cian","nhand":10,"streak":0,"hasslapped":false,"score":0},
                {"username":"John","nhand":10,"streak":0,"hasslapped":false,"score":0}
            ]
        },
        matchNum: 8, // We predetermined that the match is 8.
        tourIsOpen:true,
        openTourIdx: 0,
        stepIndex: 0,
        slapDisabled:true,
        throwDisabled:true,
        synchronizeDisabled: true,
    }
    componentDidMount(){
        /*getting to know the game format. */
        const  walkthrough_stage_1= {
            title: "Getting to know the game",
            steps:[
                /*NOTE: since our joyride component uses CSS selectors, we can't have spaces in our targets. This is also edited in gameplaycomponent. */
            {target: `#player-${this.props.myusername.replace(/ /g,"-")}`, content:"Welcome to the tepuknyamuk gameplay tour! This is you. You have 10 cards in your hand, and you can't see them.",placement:"bottom"},
            {target: "#turn-h4", content:"It is now our turn. You can see this by looking here, or by seeing that your player is highlighted in blue (below). ",placement:"left"},
            {target: "#throw-button", content:"Since it is our turn, we need to throw our hand card to the pile! Press t OR press this throw button.",placement:"bottom"},
        ]}
        /* getting to know throwing  - show this after first card thrown.*/
        const  walkthrough_stage_2= {
            title:"The counter",
            steps:[
            {target: "#gameplay-piletop-card", content:"You just threw this card to the pile.",placement:"top"},
            {target: "#gameplay-counter", content:"This is the counter. It counts for you in order (From A to K). For every throw, it gets added by one. ",placement:"bottom"},
            {target: "#gameplay-players-div", content:"The next players in turn will throw now.",placement:"right"},
        ]};
        const  walkthrough_stage_3= {
            tittle: "Throwing again",
            steps:[
        {target: `#player-${this.props.myusername.replace(/ /g,"-")}`, content:"It's back to you again. Throw! (press throw button or 't' key)", placement:"bottom"},
                ]
        }
        /* getting to know slapping */
        const  walkthrough_stage_4= {
            tittle: "Slapping",
            steps:[
            {target: "#gameplay-counter", content:`Observe the number on the counter. It is ${this.state.matchNum}.`,placement:"bottom"},
            {target: "#gameplay-piletop-card", content:`Observe the number on the card. It is ${this.state.matchNum} as well. We have a match!`,placement:"bottom"},
            {target: "#slap-button", content:`When we have a match, you must slap the pile and not be the last person to do so. Slap by pressing spacebar or the slap button now!`,placement:"bottom"},
        ]};
        /* post slap*/
        const  walkthrough_stage_5= {
            tittle: "After slapping",
            steps:[
                {target: `#player-${this.props.myusername.replace(/ /g,"-")}`, content:`Nice, you slapped before everyone else! In game, this will display whether you slapped or not, and your time.`,placement:"right"},
                {target: "#gameplay-streak", content:`You obtain streaks when you aren't the last to slap and have 0 cards on your hand. When you have 3 streaks, you win!`,placement:"bottom"},
            ]};
        /* end of tour */

        const allTours = [walkthrough_stage_1,walkthrough_stage_2, walkthrough_stage_3, walkthrough_stage_4, walkthrough_stage_5];
        this.setState({allTours: allTours});

    }
    throw= (username)=>{
        console.log("throw attempt. playerinturn : ",this.state.gameplay.playerinturn,"username: ",username)
        if(this.state.throwDisabled || username !== this.state.gameplay.playerinturn)
            return;
        if( this.state.gameplay.match){
            alert("Currently in match! you have to slap!")
            return;
        }
        let cardPop = this.state.gameplay.cardPop;
        let poppedCard = cardPop.pop();
        let players= this.state.gameplay.players.map((player) => {
                if (player.username === username) {
                    return {
                        ...player,
                        nhand: player.nhand - 1,
                    }
                }
                else
                    return player;
            });
        this.setState((prevState)=>{
            return {
                gameplay: {
                    players,
                    playerinturnidx : (prevState.gameplay.playerinturnidx + 1 )% prevState.gameplay.players.length,
                    playerinturn: prevState.gameplay.players[(prevState.gameplay.playerinturnidx + 1 ) % prevState.gameplay.players.length].username,
                    counter: prevState.gameplay.counter? (prevState.gameplay.counter + 1) % 13: 1,
                    pile :prevState.gameplay.pile.concat(poppedCard),
                    cardPop: cardPop,
                }
            }
        }, ()=>{
            if ( this.state.openTourIdx === 0 ){
                console.log("setting state to 1");
                this.setState({openTourIdx: 1,
                tourIsOpen :true});
            }else if (this.state.openTourIdx === 2 && username === this.props.myusername){
                //TODO: encapsulate this throwing stuff.
                //TODO ---------------------------------------------------------------
                let timeouts = this.state.gameplay.players.slice(1).map((player,idx)=>{
                    return setTimeout(()=>{
                        this.throw(player.username)
                    }, (idx + 1) * 500) // every 500 secs.
                })
                const timeoutForTimeouts = setTimeout(()=>{
                    timeouts.forEach((timeout)=>{
                        clearTimeout(timeout);
                    })
                    this.setState(prevState=>({
                        gameplay:{
                            ...prevState.gameplay,
                            match: true,
                        },
                        slapDisabled: false,
                        openTourIdx: 3,
                        tourIsOpen: true

                    }));
                    clearTimeout(timeoutForTimeouts);
                }, (500 * (this.state.gameplay.players.length - 1 )) + 500);
                //TODO ---------------------------------------------------------------
            }
        });


    };
    slap = (username,reactiontime)=>{
        if(this.state.slapDisabled)
            return;
        //TODO
        if(this.state.gameplay.match){
            this.setState(prevState=>({
                slapped: username === this.props.myusername? true: prevState.slapped,
                gameplay: {
                    ...prevState.gameplay,
                    players:prevState.gameplay.players.map((player)=>(
                        {
                            ...player,
                            hasslapped: username === player.username? true: player.hasslapped,
                            slapreactiontime: reactiontime
                        }
                    ))
                }

            }),()=>{
                // NOTE: get everyone to slap here as well.
                let timeout = setTimeout(()=>{
                    this.setState(prevState=>({
                        gameplay: {
                            ...prevState.gameplay,
                            players:prevState.gameplay.players.map((player)=>
                                {
                                    if( player.username === this.props.myusername){
                                        return player;
                                    }else{
                                        return {
                                            ...player,
                                            hasslapped:true,
                                            slapreactiontime: 300 + 300 * Math.random()
                                        }
                                    }
                                }
                            )
                        },
                        openTourIdx: 4,
                        tourIsOpen: true,
                    }))
                    clearTimeout(timeout);
                },400);
                //Determine loser here.



            })
        }
    };
    componentWillUnmount(){
        key.unbind('t');
        key.unbind('space');
    }
    constructor(props){
        super(props);

        // key bindings
        key('t', () => {
            if( this.state.gameplay.playerinturn === this.props.myusername){
                this.throw(this.props.myusername);
            }else{
                alert("it isn't your turn! you can't throw your card to the pile when it isn't your turn!");
            }
        });
        key('space',()=>{
            this.slap(this.props.myusername, performance.now() - this.state.myreactiontime);
        })
            // set reaction times for other players.
    }
componentDidUpdate(prevProps,prevState){
        if(this.state.gameplay.players.filter((player)=>player.hasslapped === false).length ===0){
            // MATCH RESULT
            //this.determineLoser();
            return;
        }
        if(prevState.gameplay.playerinturn !== this.state.gameplay.playerinturn){
            if(this.state.gameplay.match ){
                this.setState({myreactiontime: performance.now()})
            }
        }
}
    joyrideCallback=(state,tourIdx)=>{
        /* use state.index to refer to the index of the step */
        console.log("joyride callback with state: ",state);
        /* throw disabled only for beginning of tour */
        if( (this.state.openTourIdx >0 || state.index >=2 )&& this.state.throwDisabled){
            console.log("throw disabled now false.")
            this.setState({
                throwDisabled : false,
            });
        }
        if (state.status === "finished" && this.state.openTourIdx === 0) {
            this.setState({
                tourIsOpen: false// wait for throw.
            })
        }
         if( state.status === "finished" && state.index === 2 &&  this.state.openTourIdx === 1){
                let timeouts = this.state.gameplay.players.slice(1).map((player,idx)=>{
                    return setTimeout(()=>{
                        this.throw(player.username)
                    }, (idx + 1) * 500) // every 500 secs.
                })
             const timeoutForTimeouts = setTimeout(()=>{
                 timeouts.forEach((timeout)=>{
                     clearTimeout(timeout);
                 })
                 this.setState({
                     openTourIdx : 2,
                     tourIsOpen: true
                 })
                 clearTimeout(timeoutForTimeouts);
             }, (500 * (this.state.gameplay.players.length - 1 )) + 500);
        }
        if( state.status === "finished" && state.index === 1 &&  this.state.openTourIdx === 4){
            console.log("FINISHED WHOLE THING.")
            this.setState({
                completedTutorial:true
            })

        }


    }
    render () {
        if (this.state.completedTutorial){
            return (
                <div style={{display:'flex',flexDirection: 'column',justifyContent:'center',alignContent:"center"}}>
                    <p style={{fontSize: '30px'}}>You completed the tutorial!</p>
                    <Button onClick={this.props.onComplete}>
                        Go back
                    </Button>

                </div>
            )
        }
        const num =this.state.gameplay && this.state.gameplay.counter?  ((parseInt(this.state.gameplay.counter) - 1) % 13) + 1 : undefined;
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
        if (this.state.gameplay && this.state.allTours){
            return (
                <div>
                    {this.state.allTours.map((tour,idx)=>(
                        <Joyride
                            key={idx}
                            continuous={true}
                            steps={tour.steps}
                            run={idx === this.state.openTourIdx && this.state.tourIsOpen}
                            disableCLoseOnEsc={true}
                            showProgress={true}
                            spotlightPadding={20}
                            onRequestClose={()=>{}}
                            callback={(state)=>this.joyrideCallback(state, idx)}
                            scrollToFirstStep={true}

                        />
                    ))
                    }
                <GamePlayComponent
                    myusername={this.props.myusername}
                    gameplay={this.state.gameplay}
                    carsuit={"S"}
                    slapped={this.state.slapped}
                    loser={this.state.loser}
                    throwDisabled={this.state.throwDisabled}
                    slapDisabled={this.state.slapDisabled}
                    synchronizeDisabled={this.state.synchronizeDisabled}
                    realnum={realnum}
                    throw={()=>this.throw(this.props.myusername)}
                    slap={()=>this.slap(this.props.myusername, 1000)}

                />
                </div>
            );
        }else{
            return (
                <div style={{margin: '0 auto' ,display:'flex',flexDirection:'column',alignItems:'center'}}>
                    {!this.state.isError?
                        <span>
                                <ReactLoading type={"cylon"} color={"blue"} height={300} width={180}/>
                                <h1> joining game...</h1>
                                    </span>
                        :null}
                </div>
            );
        }
    }
}


export default GamePlayTutorial;

