import React, {Component} from 'react'
import {List,Avatar,Input,Button} from 'antd'
import {DATE_FORMAT} from "../../constants/dates";
import moment from 'moment';
import ReactList from 'react-list';
/*
PROPS:
messageFeed : array of timestamped messages
where each timestamped message is:

{
    sender_username: ___,    // username of sender
    message: ___, // message (string)
    possible feature -> tag:[___ , ____] // tagging other people - other people's usernames.
    timestamp : ___ // unix time
    namespace: ___ // namespace to which it is sent.

}

This is updated through props.
 */
class ChatRoom extends Component {

    state = {inputval : ''};
    onPressEnterHandler = (e) =>{
        if (e.target.value !== ""){
            // SEND STUFF HERE
            console.log('pressed enter for chat.');
            this.props.onMessageSend(e.target.value);
            this.setState({inputval: ''});
        }
    }
    renderItem = (index, key) =>{
        const item = this.props.messageFeed[index];
        return (
        <List.Item key={key}>
            <List.Item.Meta
                avatar={ <Avatar style={{ backgroundColor: '#87d068' }} icon="user" />}
                title={
                    <div>
                        <h4>{item.sender_username}</h4>
                        <h5>
                            {moment(item.timestamp).format(DATE_FORMAT)}
                        </h5>
                    </div>
                }
                description={item.message}
            />
            <br/>

        </List.Item>)
    }

    render() {
        return (
            <div>
                <h1>Chat</h1>
                <div style={{overflow: 'auto', maxHeight: 400}}>
                    <ReactList
                        itemRenderer={this.renderItem}
                        length={this.props.messageFeed.length}
                        type='uniform'
                    />
                    <Input
                        onChange={(e)=>this.setState({inputval:e.target.value})}
                        value={this.state.inputval}
                        placeholder={"type your message here"}
                        onPressEnter={this.onPressEnterHandler}
                    >
                    </Input>
                </div>
            </div>
        );
    }
}
export default ChatRoom;