import React from 'react';
import createHistory from 'history/createBrowserHistory';
import {Router,Switch,Route } from 'react-router-dom';
import MainPage from '../components/MainPage';
import GameLobbyPage from '../components/GameLobbyPage';
import GamePlayPage from '../components/GamePlayPage';
import IntoolsUIRouter from './IntoolsUIRouter';
import Footer from '../components/Footer';
export const history = createHistory();
const AppRouter =()=> (
    <Router history={history}>
        <div>
            <Switch>
                <Route path="/" component={MainPage} exact = {true}/>
                <Route path="/game/lobby/:uuid" component={GameLobbyPage} exact = {true}/>
                <Route path="/game/play/:uuid" component={GamePlayPage} exact = {true}/>
                { /* NOTE: only show intools in development.*/
                   process.env.NODE_ENV !== 'production'?
                    (<Route path="/IntoolsUI" component={IntoolsUIRouter} exact={false}/>)
                    : null
                }
                <Route render={()=>(<h1> ROUTE NOT FOUND</h1>)}/>
            </Switch>
            <Footer className="appFooter"/>
        </div>
    </Router>
);
export default AppRouter;


