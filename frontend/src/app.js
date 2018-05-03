import React from 'react';
import ReactDOM from 'react-dom';
import AppRouter from './routes/AppRouter';
import './styles/styles.scss'; // import styles.css to our whole oldApp
import 'normalize.css/normalize.css'; // every import not starting with
import {Provider} from 'react-redux';
import configureStore from './store/configureStore';
import {addGame} from './actions/games';
const store = configureStore();
import moment from 'moment';
import 'antd/dist/antd.css';
// NOTE: addGame doesn't go through the server here. Only for testing purposes
let game_1 = {
    name: "willys game",
    createdAt: moment.now(),
    creator:"willyspinner",
    gameId:123 // this will be the id generated as response from app backend.
}
let game_2 = {
    name: "berdogs game",
    createdAt: moment.now(),
    creator:"berdog",
    gameId:1223
}
store.dispatch(addGame(game_1));
store.dispatch(addGame(game_2));

/*
init redux GET stubs for getting all the games.
 */


const app = (
<Provider store = {store}>   
  <AppRouter/>
</Provider>
)
ReactDOM.render(app,document.getElementById('app'));
