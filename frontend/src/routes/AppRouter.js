import React from 'react';
import createHistory from 'history/createBrowserHistory';
import {Router,Switch,Route } from 'react-router-dom';
import MainPage from '../components/MainPage';
export const history = createHistory();
const AppRouter =()=> (
    <Router history={history}>
        <div>
            <Switch>
                <Route path="/" component={MainPage} exact = {true}/>
            </Switch>
        </div>
    </Router>
);
export default AppRouter;


