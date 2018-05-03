// setting up store configuration.
import {createStore, combineReducers, applyMiddleware,compose} from 'redux';
import gamesReducer from '../reducers/games';
import thunk from 'redux-thunk';
 const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ||compose ;
export default () => {
  const store = createStore(
    combineReducers({
    games: gamesReducer,
    }),
    composeEnhancers(applyMiddleware(thunk))
  );

  return store;
};

