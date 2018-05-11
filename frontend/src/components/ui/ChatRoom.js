import React, {Component} from 'react'
import {List,Avatar} from 'antd'
import {DATE_FORMAT} from "../../constants/dates";
import moment from 'moment';
/*
PROPS:
messageFeed : array of timestamped messages
where each timestamped message is:

{
    sender: ___,    // username of sender
    message: ___, // message (string)
    tag:[___ , ____] // tagging other people - other people's usernames.
    timestamp : ___ // unix time

}

This is updated through props.
 */
class ChatRoom extends Component {

    render (){
        return(
            <div style={{width: "50%"}}>
                <List
                    itemLayout="horizontal"
                    dataSource={this.props.messageFeed}
                    renderItem={item => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={ <Avatar style={{ backgroundColor: '#87d068' }} icon="user" />}
                                title={
                                    <div>
                                        <h4>{item.sender}</h4>
                                        <h5>
                                        {moment(item.timestamp).format(DATE_FORMAT)}
                                        </h5>
                                    </div>
                                        }
                                description={item.message}
                            />
                        <br/>
                        </List.Item>
                    )}
                />
            </div>
        );
    }
}

export default ChatRoom;