module.exports=  {
    GAME_CREATED: 'gameCreated',
    GAME_DELETED:'gameDeleted',
    GAME_STARTED: 'gameStarted',
    CONN_DETAILS: 'connDetails',
    LOBBY:{
        USER_JOINED: 'userJoined',
        USER_LEFT:'userLeft',
        LOBBY_GAME_DELETED:'lobbyGameDeleted',
        GAME_START: 'gameStart',
        CLIENT_ATTEMPT_JOIN:'clientAttemptJoin',
        CLIENT_ATTEMPT_JOIN_ACK:'clientAttemptJoinAck',
        CLIENT_ATTEMPT_JOIN_NOACK:'clientAttemptJoinNoAck',
        CLIENT_LEAVE: 'clientLeave',
        CLIENT_LEAVE_ACK: 'clientLeaveAck',
        CLIENT_LEAVE_NOACK: 'clientLeaveNoAck',
    },
    // these are just some helper tings that will query the socket's room information.
    UTILS:{
        CHECK_ROOM:'checkRoom'
    },
    // below are used for the chatbot
    EMIT_CHAT_MSG: "emitChatMsg",
    RECV_CHAT_MSG: "receiveChatMsg"

}