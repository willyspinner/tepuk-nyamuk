
const gamesReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_GAME':
      return [...state, action.game];
    case 'REMOVE_GAME':
      return state.filter(({id}) => id !==  action.id);
      case 'JOIN_GAME':
        return state.map((game)=>{
            if (game.gameId === action.gameId)
            {
                game.players.push(action.username);
            }
            return game;
            }
        )
      case 'LEAVE_GAME':
          return state.map((game)=>{
              console.log(`checking ${game.gameId} with ${action.gameId}`);
                  if (game.gameId === action.gameId)
                      return {
                          ...game,
                            players: game.players.filter((player_username)=>player_username !== action.username)
                  }
                  return game;
              });
    default:
      console.log(`GAME REDUCER DEFAULTING STATE for action ${action.type}`);
      return state;
  }
};

export default gamesReducer;
