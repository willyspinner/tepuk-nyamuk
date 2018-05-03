import uuid from 'uuid';
import database from '../firebase/firebase';
export const addGame = ( game )=> ({
  type: 'ADD_GAME',
    game
});

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

