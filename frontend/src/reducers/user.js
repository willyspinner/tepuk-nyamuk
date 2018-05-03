
const userReducer = (state = {}, action) => {
  switch (action.type) {
      case 'REGISTER_USER':
        return {
      username:action.username
        };
    default:
      console.log(`USERREDUCER DEFAULTING STATE for action ${action.type}`);
      return state;
  }
};

export default userReducer;
