// TODO: to link up with gms.

import mysocket from '../socket/socketclient';
/*

We only have 4 actions to use in the whole game.
Any sort of throwing by the player, or registration of throwings of other users, will be from
 the PLAYER_THREW redux action alone.

 Any sort of slapping by all players will be done through the PLAYER_SLAP redux action alone.

 Any sort of match results will be handled here.

 */

export const initializeGame = (playerinturn, players ,nhand)=> ({
    //NOTE here that players is siimply an array of usernams.
    type: 'INIT_GAME',
    game: {
        nhand,
        playerinturn,
        pile : [],
        players
    }
});
export const gameWinner = (gameFinishObj)=>({
    type: 'GAME_WINNER',
    winner:gameFinishObj.winner,
    finalscores: gameFinishObj.finalscores
})
export const finishGame = ()=>({
    type: 'FINISH_GAME',
});
// playerThrow is basically next tick.
export const playerThrow = (username, card,nextplayer,isMatch)=>({
    type: "PLAYER_THREW",
   username,
   card,
    nextplayer,
    isMatch
});

export const startPlayerThrow = ()=>{
    return (reduxDispatch,getState)=> {
        return mysocket.throwCard(); // this is a promise.
    };
}
export const startPlayerSlap = (reactiontime)=>{

    return (reduxDispatch,getState)=>{
            return mysocket.slap(reactiontime) // this is also a promise.
    }
}
export const playerSlap = (username,slapreactiontime) => ({
    type: "PLAYER_SLAP",
    username,
    slapreactiontime
});

export const receiveMatchResult = (loser,loseraddtopile,nextplayer,streakUpdate,scoreupdate)=>({
    type: "RECEIVE_MATCH_RESULT",
    loser,
    loseraddtopile,
    nextplayer,
    streakUpdate,
    scoreUpdate:scoreupdate
});

const synchronizeGameplay = (playerinturn,counter,match,pile)=>({
    type: 'SYNCHRONIZE_GAMEPLAY',
    playerinturn,
    counter,
    match,
    pile
});
export const startSynchronizeGameplay = ()=> {
    return (reduxDispatch,getState)=> {
        return new Promise((resolve,reject)=>{
            mysocket.synchronizeGameplay().then((res)=>{
                reduxDispatch(synchronizeGameplay(
                    res.playerinturn,
                    res.currentcounter,
                    res.match,
                    res.pile
                ))
                resolve(res);
            }).catch((e)=>{
                reject(e);
            })
        });
    }
    

}



