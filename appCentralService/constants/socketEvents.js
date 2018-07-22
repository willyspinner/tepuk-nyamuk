module.exports=  {
    GAME_CREATED: 'gameCreated',
    GAME_DELETED:'gameDeleted',
    GAME_STARTED: 'gameStarted',
    CONN_DETAILS: 'connDetails',
    RECV_NOTIF: 'recvNOTIF', // for users when they receive notifications when logging in.
    GET_NOTIF:'getNotif',
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
        INVITE_USER:'inviteUser',
        INVITE_USER_FAIL:'inviteUserFail',
        INVITE_USER_SUCCESS:'inviteUserSuccess',
        LOBBY_INVITATION:'lobbyInvitation',
        KICK_OUT_USER:'kickOutUser',
        KICKED_OUT:'iHaveBeenKickedOut',
    MOVING_TO_GMS: 'movingToGms'// used when the client is going to disconnect to the server.
    },
    // these are just some helper tings that will query the socket's room information.
    UTILS:{
        CHECK_ROOM:'checkRoom'
    },
    // below are used for the chatbot
    EMIT_CHAT_MSG: "emitChatMsg",
    RECV_CHAT_MSG: "receiveChatMsg"

}