
const gameplayReducer = (state= {},action)=>{
    switch(action.type){
        case 'FINISH_GAME':
            return {};
        case 'GAME_WINNER':
            return {
                ...state,
                winner: action.winner,
                finalscores: action.finalscores // ELEGANT: the clients already have an updated score view. Do we really need this ?
            };
        case 'SYNCHRONIZE_GAMEPLAY':
            return {
                ...state,
                playerinturn: action.playerinturn,
                pile: action.pile,
                counter: action.counter,
                match:action.match,
                players: state.players.map((player)=>{
                    let newNHand =  action.snapshot.filter((obj)=>obj.username === player.username);
                    newNHand = newNHand.length ===0 ? undefined: newNHand[0].nInHand;
                    return {
                        ...player,
                        nhand: newNHand? newNHand: player.nhand
                    }
                })
            };
        case 'INIT_GAME':
            console.log(`gameplayReducer: init game with ${JSON.stringify(action.game)}`);
            return {
                counter:0,
                initialized: true, //NOTEDIFF: added this so we can conditionally render on gameplaypage.
                // i.e. loading screen when not initialized yet.
                playerinturn : action.game.playerinturn,
                playerhand: action.game.playerhand,
                pile: action.game.pile,
                players : action.game.players.map((playerusername)=>{
                    return {
                        username : playerusername,
                        nhand: action.game.nhand,
                        streak : 0,
                        hasslapped: false,
                        slapreactiontime: undefined,
                        score: 0
                    }
                })
            };
        case 'RESHUFFLE':
            return {
                ...state,
                players: state.players? state.players.map((player)=>{
                    let newnhand = action.snapshot.filter((playerobj)=>playerobj.username ===player.username);
                    newnhand = newnhand.length === 1 ? newnhand[0].nInHand : player.nhand;
                    return(
                        {
                            ...player,
                            nhand: newnhand
                        }
                    );
                },
                    ): undefined,
                pile: action.newpile
            }
        case 'PLAYER_THREW':
            if(state.match === true)
                return state;
            else
            return {
                ...state,
                counter: state.counter + 1,
                match: action.isMatch || ((state.counter ) % 13 )+ 1=== action.card,
                playerinturn:action.nextplayer,
                players : state.players?state.players.map((player)=>{
                   // default streak unless still continued to streak increase.
                    if(player.username === action.username && state.playerinturn === player.username) {
                        return {
                            ...player,
                            nhand: player.nhand === 0? 0: player.nhand - 1,
                        };
                    }
                    else
                        return {
                        ...player,
                        };
                }): undefined,
                pile: state.pile? [...state.pile,action.card]: undefined
            };
        case 'PLAYER_SLAP':
            return {
                ...state,
                players : state.players? state.players.map((player)=>{
                    if(player.username === action.username
                        &&
                        state.players.find((player)=>player.username === action.username).hasslapped === false) {
                        return {
                            ...player,
                            hasslapped: true,
                            slapreactiontime:action.slapreactiontime
                        };
                    }
                    else
                        return player;
                }):undefined
            };
        case 'RECEIVE_MATCH_RESULT':
            return {
                ...state,
                pile: [],
                playerinturn: action.loser,
                counter: 0,
                match: false,
                players : state.players.map((player)=>{
                    let streak = action.streakUpdate.filter(
                        updateObj=>updateObj.username === player.username
                    )[0];
                    let newscore= action.scoreUpdate.filter((obj)=>obj.username === player.username)[0];
                    newscore = newscore? newscore.score: player.score;
                    //NOTEDIFF: if there is no update, then it'll just be the same.
                    streak = streak? streak.streak: player.streak;
                    if(player.username === action.loser) {

                        return {
                            ...player,
                            nhand: player.nhand + action.loseraddtopile,
                            hasslapped: false,
                            //NOTEDIFF: no need to make slapreactiontime undefined.
                            streak,
                            score:newscore
                        }
                    }
                    else{
                        return {
                            ...player,
                            hasslapped:false,
                            //NOTEDIFF: no need to make slapreactiontime undefined.
                            //slapreactiontime:undefined,
                            score: newscore,
                            streak
                        }
                    }
                })
            };
        default:
            return state;

    }


};
export default gameplayReducer;