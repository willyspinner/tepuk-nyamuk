// setting up store configuration.
import {createStore, combineReducers, applyMiddleware,compose} from 'redux';
import gamesReducer from '../reducers/games';
import gameplayReducer from '../reducers/gameplay';
import thunk from 'redux-thunk';
import userReducer from "../reducers/user";
 const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ||compose ;
export default () => {
  const store = createStore(
    combineReducers({
        gameplay:gameplayReducer,
    games: gamesReducer,
        user:userReducer,

    }),
    composeEnhancers(applyMiddleware(thunk))
  );

  return store;
};

