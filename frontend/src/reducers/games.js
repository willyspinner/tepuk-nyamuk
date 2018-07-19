
const gamesReducer = (state = [], action) => {
  switch (action.type) {
      case 'ADD_GAME':
        //NOTEDIFF: check if game already there.
        if( state && state.length > 0 && state.map(game=>game.uuid).includes(action.game.uuid)){
           if (!action.isUpdate)
               return state;
           else
               return state.map(game=>{
                   if (game.uuid === action.game.uuid)
                       return action.game;
                   return game;
               });
        }
        else
          return [...state, action.game];
      case 'STARTED_GAME':
          return state.map((game)=>{
              if(game.uuid === action.uuid){
                  game.isStarted = true;

              }
              return game;
          });
    case 'REMOVE_GAME':
      return state.filter(({uuid}) => uuid !==  action.uuid);
      case 'JOIN_GAME':
        return state.map((game)=>{
            if (game.uuid === action.uuid)
            {
                //NOTEDIFF: we add this so that we don't add the same person twice.
                // This happens due to a confusion in local redux code and listening
                // and reacting to socket events.
                if( game.players.indexOf(action.username) === -1)
                    game.players.push(action.username);
            }
            return game;
            }
        );
      case 'LEAVE_GAME':
          return state.map((game)=>{
                  if (game.uuid === action.uuid)
                      return {
                          ...game,
                            players: game.players.filter((player_username)=>player_username !== action.username)
                  };
                  return game;
              });
      case "EMPTY_GAME_STATE":
          return []; // no more games.
    default:
      console.log(`GAME REDUCER DEFAULTING STATE for action ${action.type}`);
      return state;
  }
};

export default gamesReducer;
