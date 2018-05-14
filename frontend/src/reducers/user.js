
const userReducer = (state = {}, action) => {
  switch (action.type) {
      case 'USER_LOGGED_IN':
        return {
            ...state,
      username:action.username,
            token: action.token
        };
    default:
      console.log(`USERREDUCER DEFAULTING STATE for action ${action.type}`);
      return state;
  }
};

export default userReducer;
