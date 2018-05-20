
const gamesReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_GAME':
      return [...state, action.game];
    case 'REMOVE_GAME':
      return state.filter(({uuid}) => uuid !==  action.uuid);
      case 'JOIN_GAME':
        return state.map((game)=>{
            if (game.uuid === action.uuid)
            {
                game.players.push(action.username);
            }
            return game;
            }
        )
      case 'LEAVE_GAME':
          return state.map((game)=>{
              console.log(`checking ${game.uuid} with ${action.uuid}`);
                  if (game.uuid === action.uuid)
                      return {
                          ...game,
                            players: game.players.filter((player_username)=>player_username !== action.username)
                  }
                  return game;
              });
      case "EMPTY_REDUX_STATE":
          return [] // no more games.
    default:
      console.log(`GAME REDUCER DEFAULTING STATE for action ${action.type}`);
      return state;
  }
};

export default gamesReducer;
