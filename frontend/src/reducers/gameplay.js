
const gameplayReducer = (state= {},action)=>{
    switch(action.type){
        case 'FINISH_GAME':
            return {};
        case 'INIT_GAME':
            console.log(`gameplayReducer: init game with ${JSON.stringify(action.game)}`);
            return {
                counter:0,
                playerinturn : action.game.playerinturn,
                playerhand: action.game.playerhand,
                pile: action.game.pile,
                players : action.game.players.map((player)=>{
                    return {
                        username : player,
                        nhand: action.game.nhand,
                        streaks : 0,
                        hasslapped: false,
                        slapreactiontime: undefined
                    }
                })
            };
        case 'PLAYER_THREW':
            if(state.match === true)
                return state;
            else
            return {
                ...state,
                counter: state.counter + 1,
                match: action.isMatch || ((state.counter ) % 13 )+ 1=== action.card,
                playerinturn:action.nextplayer,
                players : state.players.map((player)=>{
                    if(player.username === action.username && state.playerinturn === player.username) {
                        return {
                            ...player,
                            nhand: player.nhand === 0? 0: player.nhand - 1,
                        };
                    }
                    else
                        return player;
                }),
                pile: [...state.pile,action.card]
            };
        case 'PLAYER_SLAP':
            return {
                ...state,
                players : state.players.map((player)=>{
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
                })
            };
        case 'RECEIVE_MATCH_RESULT':
            return {
                ...state,
                pile: [],
                playerinturn: action.loser,
                counter: 0,
                match: false,
                players : state.players.map((player)=>{
                    if(player.username === action.loser) {

                        console.log(`receive match result zeroing hasslapped for loser ${player.username}`);
                        return {
                            ...player,
                            nhand: player.nhand + action.loseraddtopile,
                            hasslapped: false,
                            slapreactiontime:undefined
                        }
                    }
                    else{
                        console.log(`receive match result zeroing hasslapped for ${player.username}`);
                        return {
                            ...player,
                            hasslapped:false,
                            slapreactiontime:undefined
                        }
                    }
                })
            };
        default:
            return state;

    }


};
export default gameplayReducer;