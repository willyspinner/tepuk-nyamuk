// TODO: to link up with gms.


/*

We only have 4 actions to use in the whole game.
Any sort of throwing by the player, or registration of throwings of other users, will be from
 the PLAYER_THREW redux action alone.

 Any sort of slapping by all players will be done through the PLAYER_SLAP redux action alone.

 Any sort of match results will be handled here.

 */

export const initializeGame = (playerinturn,playerhand, players ,nhands)=> ({
    //NOTE here that players is siimply an array of usernams.
    type: 'INIT_GAME',
    game: {
        nhand,
        playerinturn,
        playerhand,
        pile : [],
        players
    }
});
export const finishGame = ()=>({
    type: 'FINISH_GAME'
});
// playerThrow is basically next tick.
export const playerThrow = (username, card,nextplayer)=>({
    type: "PLAYER_THREW",
   username,
   card,
    nextplayer
});

export const playerSlap = (username,slapreactiontime) => ({
    type: "PLAYER_SLAP",
    username,
    slapreactiontime
});

export const resolveMatchResult = (loser,loseraddtopile,nextplayer)=>({
    type: "RECEIVE_MATCH_RESULT",
    loser,
    loseraddtopile,
    nextplayer
});

