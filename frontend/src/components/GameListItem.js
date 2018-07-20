import React from 'react';
import {Card, Icon, List, Tooltip} from 'antd';
import {DATE_FORMAT} from "../constants/dates";
import moment from 'moment';
const GameListItem = (props)=> (
    <div className="gameList__item">
        <Card
            title={props.game.name?props.game.name:"untitled"}

            extra={
                <div onClick={props.game.isStarted? null:props.onJoin}>
                    {
                        props.game.isStarted? null:(

                            <div className={props.game && props.game.gameoptions&&props.game.gameoptions.numberOfMaxPlayers === props.game.players.length? "":"gameList__item__joinButton"}>
                                {props.game && props.gameoptions && props.game.gameoptions.numberOfMaxPlayers === props.game.players.length? (
                                    <Tooltip title="Sorry! The game is full.">
                                <Icon
                                    type="rocket"
                                />
                                <h6>Join</h6>
                                    </Tooltip>
                                    ):
                                    (<div>
                            <Icon
                                type="rocket"
                            />
                            <h6>Join</h6>
                                        </div>
                                    )}
                            </div>
                        )
                    }
                </div>
            }
            style={{ width: 300 ,...props.game.isStarted?{background:'grey'}:null}}>
            <div>
                <h2>{props.game.isStarted? "STARTED":null}</h2>
                <h5>
                    Created at: {moment(props.game.createdAt).format(DATE_FORMAT)}
                </h5>
                <br/>
                <h5>
                    Creator: {props.game.creator}
                </h5>
                {props.game.gameoptions && props.game.gameoptions.numberOfMaxPlayers?
                    (
                        <h4>
                        Players: {props.game.players.length} / {props.game.gameoptions.numberOfMaxPlayers}
                        </h4>
                    )
                    : (<h4>Players:</h4>)}
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