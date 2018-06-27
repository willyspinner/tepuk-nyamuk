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

    constructor(props){
        super(props);
    }

    state = {inputval : ''};
    onPressEnterHandler = (e) => {
        if (e.target.value !== "") {
            // SEND STUFF HERE
            console.log('pressed enter for chat.');
            this.props.onMessageSend(e.target.value);
            this.setState({inputval: ''});
        }
    }
    renderItem = (index, key) =>{
        const item = this.props.messageFeed[index];
        return (
            <div key={key}>
                <h3>
                    {item.sender_username}: {item.message}
                </h3>
                <h5 style ={{color:'grey'}}>
                    {moment(item.timestamp).format(DATE_FORMAT)}
                </h5>
            </div> )

    }

    render() {
        if(this.reffy)
            this.reffy.scrollTo(this.reffy.getVisibleRange()[1] );
        return (
            <div style={{height : 350}}>
                <div style={{overflow: 'auto', maxHeight: 300}}>
                    <ReactList
                        itemRenderer={this.renderItem}
                        length={this.props.messageFeed.length}
                        type='uniform'
                        ref={ref=>{this.reffy = ref;}}
                    />
                </div>
                <Input
                    onChange={(e)=>this.setState({inputval:e.target.value})}
                    value={this.state.inputval}
                    placeholder={"type your message here"}
                    onPressEnter={this.onPressEnterHandler}
                >
                </Input>
            </div>
        );
    }
}
export default ChatRoom;