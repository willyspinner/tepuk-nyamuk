const chatReducer = (state= {},action)=>{
    switch(action.type) {
        case 'RECV_MSG':
            if(action.message_obj.namespace === null){
                state.main.push(action.message_obj);
                return state;
            }else {
                state.room.push(action.message_obj);
                return state;
            }
        default:
            return state;
    }
}

export default chatReducer;
/* Example chat state

{
    // the main room chat.
    main: [
         // this is a message object. Sent on every RECV.
        {
            sender_username : 'USERNAME',
            msg_id : "MESSAGE_ID",
            namespace: null,
            message: "Whats up dawgs",
            timestamp: 12301948124 // UNIX TIMESTAMP
        }
    ],
    // the room that you joined
    room: [
    // just like message object above.
    ]

]






 */