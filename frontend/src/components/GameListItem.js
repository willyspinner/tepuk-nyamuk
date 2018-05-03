import React from 'react';
import {Card,Icon,List} from 'antd';
import {DATE_FORMAT} from "../constants/dates";
import moment from 'moment';
const GameListItem = (props)=> (
    <div className="gameList__item">
        <Card
            title={props.game.name?props.game.name:"untitled"}
            extra={
                <div onClick={props.onJoin}>
                    <Icon
                        type="rocket"
                        />
                    <h6>
                        Join
                    </h6>
                </div>
            }
            style={{ width: 300 }}>
            <div>
                <h5>
                    Created at: {moment(props.game.createdAt).format(DATE_FORMAT)}
                </h5>
                <br/>
                <h5>
                    Creator: {props.game.creator}
                </h5>
                <h4>
                    Players:
                </h4>
                <List
                    size="small"
                    bordered
                    dataSource={props.game.players}
                    renderItem={item => (<List.Item>{item}</List.Item>)}
                />
            </div>
        </Card>
    </div>
);
export default GameListItem;