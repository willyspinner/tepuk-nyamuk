
const userReducer = (state ={} , action) => {
  switch (action.type) {
      case 'USER_LOGGED_IN':
        return {
            ...state,
              username:action.username,
            token: action.token
        };
      case 'USER_LOG_OUT':
          return {} ; //blank.
      case 'RECORD_CURRENT_GAMEID':
          return {
              ...state,
              gameid:action.gameid
          };
      case 'USER_CONNECT_SOCKET':
          return {
              ...state,
              socketid: action.socketid
          };

      case 'RECEIVE_LOBBY_INVITATION':
          return {
              ...state,
              invitation:action.invitation
          }
      case 'DISCARD_LOBBY_INVITATION':
          return {
              ...state,
              invitation:undefined
          }
      case 'UPDATE_EXP':
          return {
              ...state,
              ...action.expObject
          }
    default:
      console.log(`USERREDUCER DEFAULTING STATE for action ${action.type}`);
      return state;
  }
};

export default userReducer;
