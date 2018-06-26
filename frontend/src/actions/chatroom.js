import mysocket from '../socket/socketclient';

export const startSendMessage = (msg) => {
    //NOTE: any variables that isn't changed directly by us (i.e. in redux state)
    // should NOT be put as an argument. we should instead put it here instead.
    //NOTE: this one calls receiveGlobalMessage as to update who sent it.
    return (reduxDispatch,getState) => {
            let messageObj = {
              message:msg,
              sender_username: getState().user.username,
                //TODO: HOW TO DO NAMESPACE?
                //TEMPDIS: Put main namespace for now.
              namespace: null//getState().user.gameid,
            };
           mysocket.sendChatMessage(messageObj);
    }
}


export const receiveMessage = (message_object)  => {
    return {
        type: "RECV_MSG" ,
        message_obj : {
           sender_username: message_object.sender_username,
            message: message_object.message,
            namespace: message_object.namespace,
            timestamp: message_object.timestamp,
            msg_id
        }

    }

}