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
        if (item.namespace !== this.props.namespace){
            return null;
        }
        //TODO: style other people's messages vs MY messages differently!
        // TODO: makes for a nice visual effect. Maybe lighter blue shade for other ppl?
        return (
            <div key={key} style={{marginTop:'3px',marginBottom:'3px'}}>
                <div style={{background:'#49adff', borderRadius: '18px'}}>
                <div style={{paddingTop:'8px',display:'flex',flexDirection:'row',lineHeight:'0px'}}>
                    <div>
                        <p style={{marginLeft:'10px',color:'white'}}>
                            {item.sender_username}
                        </p>
                    </div>
                    <div style={{marginLeft:'5px',wordWrap:'normal',display:'block',  wordBreak: 'break-all', whiteSpace:'normal'}}>
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
        if(this.reffy)
            this.reffy.scrollTo(this.reffy.getVisibleRange()[1] );
        return (
            <div>
            <div style={{height : 250, display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                <div style={{overflow: 'auto'}}>
                    <ReactList
                        itemRenderer={this.renderItem}
                        length={this.props.messageFeed.length}
                        type='uniform'
                        ref={ref=>{this.reffy = ref;}}
                    />
                </div>
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