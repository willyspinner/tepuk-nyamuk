import React, {Component} from 'react'
import {Input} from 'antd'
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

    constructor(props){
        super(props);
    }
    scrollToBottom = () => {
        if(this.messageEnd)
        this.messageEnd.scrollIntoView({ behavior: "smooth" });
    }

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
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
        if (item.namespace !== this.props.namespace){
            return null;
        }
        const isMe = item.sender_username === this.props.username;
        return (
            <div key={key} style={{marginTop:'3px',marginBottom:'3px'}}>
                <div style={{background:isMe?'#a4d12a':'#49adff', borderRadius: '18px'}}>
                <div style={{paddingTop:'8px',display:'flex',flexDirection: isMe? 'row-reverse':'row',lineHeight:'0px'}}>
                    <div>
                        <p style={{...isMe?{marginRight: '10px'}:{marginLeft:'10px'},color:'white'}}>
                            {item.sender_username}
                        </p>
                    </div>
                    <div style={{...isMe? {marginRight:'5px'}:{marginLeft:'5px'},wordWrap:'normal',display:'block',  wordBreak: 'break-all', whiteSpace:'normal'}}>
                            {item.message}
                    </div>
                </div>
                <h6 style ={{marginLeft:'10px',color:'white'}}>
                    {moment(item.timestamp).format(DATE_FORMAT)}
                </h6>
                </div>
            </div> )

    }

    render() {
        return (
            <div>
            <div style={{height : 250, display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                {this.props.messageFeed.length ===0 ?
                    (<p style={{color:'grey'}}> Chat with {this.props.namespace === null? 'everyone': 'people in the lobby'} here!</p>
              ):
                <div style={{overflow: 'auto'}}>
                    {this.props.messageFeed.map((msg,index)=>{
                        return this.renderItem(index,index);
                    })}

                    <div
                        ref={el => { this.messageEnd = el; }}
                    >
                    </div>
                </div>
            }
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