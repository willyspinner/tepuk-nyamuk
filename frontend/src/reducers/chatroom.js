const chatReducer = (state= {main: [], room: []},action)=>{
    switch(action.type) {
        case 'RECV_MSG':
            if(action.message_obj.namespace === null){
                /*
                state.main.push(action.message_obj);
                return state;
                */
                return {
                    ...state,
                    main: [...state.main,action.message_obj]
                }
            }else {
                /*
                state.room.push(action.message_obj);
                return state;
                */
                return {
                    ...state,
                    room: [...state.room,action.message_obj]
                }
            }
        case 'INIT_CHAT':
            if( action.namespace)
            return {
                ...state,
                room : action.chat
            }
            else
                return {
                    ...state,
                    main: action.chat
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