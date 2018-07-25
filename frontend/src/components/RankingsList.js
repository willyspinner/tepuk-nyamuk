import React from 'react';
import IMGTYPES from '../constants/imgTypes';
import LEVELS from "../../../appCentralService/exp/expConfig";
import {Table} from 'antd';
/*
We expect the following props:
- rankings:
            an array of elements of type {username:___, level:___, exp:___}
- isLoading : (bool) whether loading or not.
 */
const columns = [{
    title: 'Name',
    dataIndex: 'username',
    key: 'name'
},
    {
        title:'Level',
        dataIndex: 'level',
        key: 'level',
        render: level=> (
            <div style={{display:'flex',flexDirection:'row',justifyContent:'space-between' }}>
                <p style={{marginRight: '5px'}}> Lvl. {level + 1} - {LEVELS.EXPLEVELS[level].levelname}</p>
                < div
                    className="gameLobbyPage__levelIcon"
                >
                <img
                    src={IMGTYPES.levels.white[parseInt(level)]}
                     height={40}
                     width={40}
                />
                </div>
            </div>)
    },
    {title:'Exp',
    dataIndex: 'exp',
    key:'index'}];
const RankingsList = (props)=>{
    const datasource =props.rankings ?  props.rankings.sort((player1,player2)=>player1.exp < player2.exp).map((player,idx)=>({
        ...player,
        key: idx + 1
    })): [];
return (
    <div>
        {props.isVisible ?(
<Table columns={columns}
       dataSource={datasource}
       bordered
       loading={props.isLoading}
       />
            ):null}
    </div>
)
}
export default RankingsList;