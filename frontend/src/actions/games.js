export const addGame = ( game )=> ({
  type: 'ADD_GAME',
    game:{
        ...game,
        players:[game.creator]
    }
});
export const joinGame = (gameId,username) => ({
    type :'JOIN_GAME',
    gameId,
    username
})
export const startJoinGame = (gameId,username) => {
    return (reduxDispatch,getState) => {
        //TODO: send an axios POST to join

    }
}
export const startAddGame = (expenseData = {}) => {

    return (reduxDispatch, getState) => {
        //TODO: send an axios POST req/res here.
    };
}

export const removeGame = ({id} = {}) => { // ID MUST BE FILLED. NO DEFAULTS
  if( typeof id === 'undefined')
    return {};
  return {
    'type': 'REMOVE_EXPENSE',
    'id': id
  }

}

export const startRemoveGame = ({id}) => {
    return (reduxDispatch,getState) => {
        //TODO: send a DELETE request here
    };

};

