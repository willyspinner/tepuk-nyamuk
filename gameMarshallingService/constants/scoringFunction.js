/*
This is the function that determines how the game is scored.
We are using a reciprocal function where score is inversely proportional to reaction time.
 */
module.exports = (isMatch,reactionTimeInMilliSeconds)=>{
    if (isMatch)
        // reaction time based scoring.
        return (250000 / reactionTimeInMilliSeconds);
    else
        // false slap. Punish player by decrementing score.
        return -500;
}