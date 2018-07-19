import React from 'react';
import {List, Icon} from 'antd';

const ScoreRankings = (props) => {
    const sorted_scores = props.finalscores? props.finalscores
        .sort((player_a, player_b) => player_b.score - player_a.score): undefined

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            {
                sorted_scores ?
                    <div>
                        <h2>Score Rankings </h2>
                        <List
                            size="small"
                            bordered
                            style={{background: '#279cff', borderRadius: '20px'}}
                            dataSource={
                                sorted_scores
                                    .map((player, idx) => ({...player, idx}))
                            }
                            renderItem={player_obj => (
                                    <div
                                        style={{
                                            background: player_obj.username=== props.winner? '#33ff00':'#27ccff',
                                            borderBottom: player_obj.username === props.winner? '10px solid #33e000':'10px solid #27acff',
                                            width: `300px`,
                                            display: 'flex',
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            padding:'10px',
                                            borderRadius: '15px',
                                            //marginBottom: '15px'
                                            marginLeft:'20px',
                                            marginRight:'20px',
                                            marginTop:'10px',
                                            marginBottom:'10px',

                                        }}
                                    >
                                            <h3>
                                                {player_obj.username}
                                            </h3>
                                            {player_obj.username === props.winner? <Icon type="trophy" style={{fontSize: 35,color:'white'}}/> : null}
                                                <h3 >
                                                {player_obj.score}
                                            </h3>
                                    </div>
                                )}
                        />
                    </div>
                    : null
            }
        </div>


    )

};
export default ScoreRankings;