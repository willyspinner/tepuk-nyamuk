
const gamesReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_GAME':
      return [...state, action.game];
    case 'REMOVE_GAME':
      return state.filter(({id}) => id !==  action.id);
      case 'JOIN_GAME':

          return state;
    default:
      console.log(`GAME REDUCER DEFAULTING STATE for action ${action.type}`);
      return state;
  }
};

export default gamesReducer;
