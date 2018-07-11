import React, {Component} from 'react'
import {Input, Button, Icon} from 'antd'
import {DATE_FORMAT} from "../../constants/dates";
import moment from 'moment';

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

    constructor(props) {
        super(props);
    }

    scrollToBottom = () => {
        if (this.messageEnd)
            this.messageEnd.scrollIntoView({behavior: "smooth"});
    }

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    state = {inputval: ''};
    onPressEnterHandler = () => {
        if (this.state.inputval !== "") {
            this.props.onMessageSend(this.state.inputval);
            this.setState({inputval: ''});
        }
    }
    //TODO: do Overflow wrapping for chat message.
    renderItem = (index, key) => {
        const item = this.props.messageFeed[index];
        if (item.namespace !== this.props.namespace) {
            return null;
        }
        const isMe = item.sender_username === this.props.username;
        return (
            <div key={key} style={{
                marginTop: '4px',
                marginBottom: '4px',
                display: 'flex',
                flexDirection: isMe ? 'row-reverse' : 'row'
            }}>
                <div style={{
                    background: isMe ? '#a4d12a' : '#49adff',
                    borderRadius: '18px',
                    borderBottom: '4px solid grey',
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        paddingTop: '2px',
                        flexShrink: 1
                    }}>
                        <p style={{
                            marginLeft: '10px',
                            color: 'white',
                        }}>
                            {item.sender_username}
                        </p>
                        <p style={{
                            overflowWrap: 'break-word',
                            wordWrap: 'break-word',
                            hyphens: 'auto',
                            marginRight: '7px',
                            marginLeft: '7px'
                        }}>
                            {item.message}
                        </p>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'row', fontSize: 13}}>
                        <h6 style={{marginRight: '8px', marginLeft: '8px', color: 'white'}}>
                            {moment(item.timestamp).format(DATE_FORMAT)}
                        </h6>
                    </div>
                </div>
            </div>
        )

    }

    render() {
        return (
            <div>
                <div style={{
                    height: 250,
                    background: '#2E3032',
                    paddingLeft: '4px',
                    paddingRight: '4px',
                    borderRadius: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    {this.props.messageFeed.length === 0 ?
                        (<p style={{color: 'grey', marginLeft: '10px'}}> Chat
                                with {this.props.namespace === null ? 'everyone' : 'people in the lobby'} here!</p>
                        ) :
                        <div style={{overflow: 'auto'}}>
                            {this.props.messageFeed.map((msg, index) => {
                                return this.renderItem(index, index);
                            })}

                            <div
                                ref={el => {
                                    this.messageEnd = el;
                                }}
                            >
                            </div>
                        </div>
                    }
                </div>

                <div>
                    <div style={{display: 'flex', flexDirection: 'row'}}>
                        <div style={{width: '90%', marginTop: '6px'}}>
                            <Input
                                onChange={(e) => this.setState({inputval: e.target.value})}
                                value={this.state.inputval}
                                placeholder={"type your message here"}
                                onPressEnter={this.onPressEnterHandler}
                            >

                            </Input>
                        </div>
                        <Button onClick={this.onPressEnterHandler} style={{marginTop: '6px'}}>
                            <Icon type="notification"/>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}

export default ChatRoom;