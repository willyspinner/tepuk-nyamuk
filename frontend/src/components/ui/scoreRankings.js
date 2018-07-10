import React from 'react';

const ScoreRankings = (props)=>{
    return (
        <div>
            <h3>
                ranking:
            </h3>
            {
                props.finalscores?
                    props.finalscores
                    .sort((player_a, player_b) => player_b.score - player_a.score)
                    .map((player_obj,idx) => (
                        <div key={idx}>
                            <h4>
                                {idx+1}. {player_obj.username}
                            </h4>
                            <p>score: {player_obj.score}</p>
                        </div>
                    )): null
            }
        </div>


)

}
export default ScoreRankings;