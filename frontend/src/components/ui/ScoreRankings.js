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
                            style={{background: '#279cff'}}
                            dataSource={
                                sorted_scores
                                    .map((player, idx) => ({...player, idx}))
                            }
                            renderItem={player_obj => (
                                <List.Item>
                                    <div
                                        style={{
                                            background: '#27ccff',
                                            border: ' 5px solid #27acff',
                                            width: `300px`,
                                            display: 'flex',
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            padding:'10px'
                                        }}
                                    >
                                            <h3>
                                                {player_obj.username}
                                            </h3>
                                            {player_obj.idx === 0 ? <Icon type="trophy" style={{fontSize: 35}}/> : null}
                                            <h3>
                                                {player_obj.score}
                                            </h3>
                                    </div>
                                </List.Item>)}
                        />
                    </div>
                    : null
            }
        </div>


    )

};
export default ScoreRankings;