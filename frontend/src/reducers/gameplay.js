//TODO: make reducer for gameplay (interaction with GMS)

const gameplayReducer = (state= {},action)=>{
    switch(action.type){
        case 'FINISH_GAME':
            return {};
        case 'INIT_GAME':
            console.log(`gameplayReducer: init game with ${JSON.stringify(action.game)}`)
            return {
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
            return {
                ...state,
                players : state.players.map((player)=>{
                    if(player.username === action.username && state.playerinturn === player.username) {
                        return {
                            ...player,
                            nhand: player.nhand - 1,
                        };
                    }
                    else
                        return player;
                }),
                pile: [...state.pile,action.card]
            }
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
            }
        case 'RECEIVE_MATCH_RESULT':
            return {
                ...state,
                pile: [],
                players : state.players.map((player)=>{
                    if(player.username === action.loser) {
                        return {
                            ...player,
                            nhand: player.nhand + state.loseraddtopile,
                            hasslapped: false,
                            slapreactiontime:undefined
                        }
                    }
                    else{
                        return {
                            ...player,
                            hasslapped:false,
                            slapreactiontime:undefined
                        }
                    }
                })
            }

    }


}
export default gameplayReducer;