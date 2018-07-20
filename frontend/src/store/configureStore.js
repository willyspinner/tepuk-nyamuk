// setting up store configuration.
import {createStore, combineReducers, applyMiddleware,compose} from 'redux';
import gamesReducer from '../reducers/games';
import gameplayReducer from '../reducers/gameplay';
import chatroomReducer from '../reducers/chatroom';
import thunk from 'redux-thunk';
import userReducer from "../reducers/user";
 const composeEnhancers =process.env.NODE_ENV === 'production' ? compose: window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ||compose ;
export default () => {
  const store = createStore(
    combineReducers({
        gameplay:gameplayReducer,
    games: gamesReducer,
        user:userReducer,
        chat: chatroomReducer

    }),
    composeEnhancers(applyMiddleware(thunk))
  );

  return store;
};

