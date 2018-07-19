import React from 'react';
import createHistory from 'history/createBrowserHistory';
import {Router,Switch,Route } from 'react-router-dom';
import MainPage from '../components/MainPage';
import GameLobbyPage from '../components/GameLobbyPage';
import GamePlayPage from '../components/GamePlayPage';
import IntoolsUIRouter from './IntoolsUIRouter';
import Footer from '../components/Footer';
import Header from '../components/Header';
import {Button} from "antd";
export const history = createHistory();
const AppRouter =()=> (
    <Router history={history}>
        <div>
            <Header />
            <Switch>
                <Route path="/" render={(props)=><MainPage {...props}/>} exact = {true}/>
                <Route path="/game/lobby/:uuid" render={(props)=><GameLobbyPage key={props.match.params.uuid} {...props}/>} e exact = {true}/>
                <Route path="/game/play/:uuid" render={(props)=><GamePlayPage key={props.match.params.uuid} {...props}/>} exact = {true}/>
                { /* NOTE: only show intools in development.*/
                   process.env.NODE_ENV !== 'production'?
                    (<Route path="/IntoolsUI" component={IntoolsUIRouter} exact={false}/>)
                    : null
                }
                <Route render={()=>(
                    <div>
                    <h1> ROUTE NOT FOUND</h1>
                        <Button onClick={()=>history.push('/')}>Go back to Main page</Button>
                    </div>
                )}/>
            </Switch>
            <Footer className="appFooter"/>
        </div>
    </Router>
);
export default AppRouter;


