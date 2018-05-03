import React from 'react';
import createHistory from 'history/createBrowserHistory';
import {Router,Switch,Route } from 'react-router-dom';
import MainPage from '../components/MainPage';
import GameLobbyPage from '../components/GameLobbyPage';
export const history = createHistory();
const AppRouter =()=> (
    <Router history={history}>
        <div>
            <Switch>
                <Route path="/" component={MainPage} exact = {true}/>
                <Route path="/game/lobby/:gameId" component={GameLobbyPage} exact = {true}/>
                <Route component={()=>(<h1> ROUTE NOT FOUND</h1>)}/>
            </Switch>
        </div>
    </Router>
);
export default AppRouter;


