import React from 'react';
import {List,Icon} from 'antd';
const ScoreRankings = (props)=>{
     const sorted_scores=   props.finalscores
            .sort((player_a, player_b) => player_b.score - player_a.score)
    const highest_score = sorted_scores[0].score;
    return (
        <div style={{display:'flex',
            justifyContent:'center',
            alignItems:'center',
        }}>
            {
                props.finalscores?
                    <List
                        size="small"
                        header={
                            <div style={{background:'white'}}>
                            <h2>Rankings </h2>
                            </div>
                        }
                        bordered
                        dataSource={
                            sorted_scores
                        .map((player,idx)=>({...player, idx}))
                        }
                        renderItem={player_obj=> (<List.Item>
                            <div
                                 style={{background:'#27ccff',
                                     border:' 5px solid #27acff',
                                 width: `300px`}}
                                     >
                                <div style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
                                <h3>
                                    {player_obj.idx+1}. {player_obj.username}
                                </h3>
                                    {player_obj.idx ===0?<Icon type="trophy" style={{fontSize:35}}/>:null}
                                <h3>
                                     {player_obj.score}
                                </h3>
                                </div>
                            </div>
                        </List.Item>)}
                    />
                    : null
            }
        </div>


)

};
export default ScoreRankings;