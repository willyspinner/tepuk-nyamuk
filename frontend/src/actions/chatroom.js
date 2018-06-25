import mysocket from '../socket/socketclient';

export const startSendGlobalMessage = (msg) => {
    //NOTE: any variables that isn't changed directly by us (i.e. in redux state)
    // should NOT be put as an argument. we should instead put it here instead.
    //NOTE: this one calls receiveGlobalMessage as to update who sent it.
    return (reduxDispatch,getState) => {
        return new Promise((resolve,reject)=>{
         //TODO
        });
    }

}


export const receiveGLobalMessage = (sender_username, msg)  => {

}