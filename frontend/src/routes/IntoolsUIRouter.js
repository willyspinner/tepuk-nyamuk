import React from 'react';
import createHistory from 'history/createBrowserHistory';
import {Router,Switch,Route } from 'react-router-dom';
import ChatRoom from '../components/ui/ChatRoom';
import ExpUpdateModal from '../components/ExpUpdateModal';
import ScoreRankings from "../components/ui/ScoreRankings";
import {Button} from 'antd';
import PlayingCard from "../components/ui/PlayingCard";
import Sound from 'react-sound';
import SOUNDTYPES from '../constants/soundTypes';
export const history = createHistory();
const EXPLEVELS= require('../../../appCentralService/exp/expConfig').EXPLEVELS;
const sampleMessageFeed= [
    {
        sender_username: 'berdoge',
        message:'hey,',
        timestamp: 102958102,
        namespace:'berdoge',
    }
];
const sampleFinalScores= [
    {username: 'willy J',score:500},
    {username:'berdog B',score:200},
    {username:'patrick S.',score:1000},
    {username:'david K.',score:150},
    {username:'Eden Hazard',score:30000},
    {username: 'Romelu Lukaku', score: 34000}
];
const IntoolsUIRouter =()=> (
    <Router history={history}>
        <div>
            <h1 style={{textAlign:'center'}}> UI Intools </h1>
            <p style={{textAlign:'center'}}> FOR TESTING PURPOSES ONLY. Use for testing UI look and feel.</p>
            <div style={{display:'flex',flexDirection:'row',justifyContent:'center', marginBottom:'15px'}}>
            <Button onClick={()=>history.push('/intoolsUI/ChatRoom')} >
                ChatRoom
            </Button>
                <Button onClick={()=>history.push('/intoolsUI/ScoreRankings')} >
                Score Rankings
                </Button>
                <Button onClick={()=>history.push('/intoolsUI/slap')} >
                    gameplay slap
                </Button>
                <Button onClick={()=>history.push('/intoolsUI/sound')} >
                    Joined Game Lobby sound
                </Button>
                <Button onClick={()=>history.push('/intoolsUI/expUpdateModal')} >
                    expUpdateModal
                </Button>
            </div>
            <Switch>
                <Route
                    path="/intoolsUI/ChatRoom"
                    exact = {true}
                    render={()=>(
                        <ChatRoom
                            namespace={'berdoge'}
                            messageFeed={sampleMessageFeed}
                            onMessageSend={(val)=> {
                                sampleMessageFeed.push({
                                    sender_username: 'me',
                                    message: val,
                                    timestamp: 120318249,
                                    namespace: 'berdoge'
                                });
                                sampleMessageFeed.push({sender_username:'cron job',message:`Messaging you @ ${new Date()}.`,timestamp:Date.now(),namespace:'berdoge' });
                            }
                            }
                            username={"me"}
                        />
                    )}
                />
                <Route
                    path ="/intoolsUI/ScoreRankings"
                    exact={true}
                    render={()=>(
                        <ScoreRankings
                            finalscores={sampleFinalScores}
                            winner={sampleFinalScores[5].username}
                        />
                    )

                    }
                />
                <Route
                    path={"/intoolsUI/sound"}
                    exact={true}
                    render={()=>(
                        <div>
                            <Sound
                                url={SOUNDTYPES.lobby.joined}
                                playStatus={Sound.status.PLAYING}
                            />
                            <p>
                                These sounds are served from our frontend server. They are requested from the client, and loaded into the
                                react-sound component ('Sound').

                            </p>

                            <p>
                                TODO: make/configure caching for these sounds.
                            </p>
                        </div>

                        )}
                    />
                <Route
                    path={"/intoolsUI/slap"}
                    exact={true}
                    render={()=>(
                        <div style={{display:'flex',flexDirection:'row', justifyContent:'space-between'}}>
                            <div style={{marginLeft:'15px'}}>
                                <h2>has slapped:</h2>
                            <PlayingCard
                                suit={"H"}
                                number={12}
                                hasSlapped={true}
                            />
                            </div>
                                <div style={{marginRight:'15px'}}>
                                <h2>has not slapped:</h2>
                            <PlayingCard
                                suit={"H"}
                                number={2}
                                hasSlapped={false}
                            />
                            </div>

                        </div>
                    )}
                />
                <Route
                    path={"/intoolsUI/expUpdateModal"}
                    exact={true}
                    render={()=>(
                        <ExpUpdateModal
                        isOpen={true}
                        previousLevelIdx={4}
                        previousExp={2000}
                        previousLevelObj={EXPLEVELS[4]}
                        currentLevelIdx={5}
                        currentExp={2700}
                        currentLevelObj={EXPLEVELS[5]}
                        onRequestClose={()=>alert('on request close.')}

                        />
                        )}
                    />

                <Route render={()=>(<h3> Please select a UI component to continue.</h3>)}/>
            </Switch>
        </div>
    </Router>
);
export default IntoolsUIRouter;

