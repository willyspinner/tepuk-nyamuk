import React from 'react';
import createHistory from 'history/createBrowserHistory';
import {Router,Switch,Route } from 'react-router-dom';
import ChatRoom from '../components/ui/ChatRoom';
import ExpUpdateModal from '../components/ExpUpdateModal';
import ScoreRankings from "../components/ui/ScoreRankings";
import {Button} from 'antd';
import Modal from 'react-modal';
import PlayingCard from "../components/ui/PlayingCard";
import Sound from 'react-sound';
import SOUNDTYPES from '../constants/soundTypes';
import RankingsList from "../components/RankingsList";
import GamePlayTutorial from "../components/GamePlayTutorial";
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
class IntoolsUIRouter extends React.Component {
    state={
        showTutorial:true
    }
    render() {
        return (
            <Router history={history}>
                <div>
                    <h1 style={{textAlign: 'center'}}> UI Intools </h1>
                    <p style={{textAlign: 'center'}}> FOR TESTING PURPOSES ONLY. Use for testing UI look and feel. This page is disabled in production.</p>
                    <div
                        style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', marginBottom: '15px'}}>
                        <Button onClick={() => {
                            this.setState({showTutorial: true});
                            history.push('/intoolsUI/gameplayTutorial')
                        }}
                        >
                            Gameplay Tutorial
                        </Button>
                        <Button onClick={() => history.push('/intoolsUI/ChatRoom')}>
                            ChatRoom
                        </Button>
                        <Button onClick={() => history.push('/intoolsUI/ScoreRankings')}>
                            Score Rankings
                        </Button>
                        <Button onClick={() => history.push('/intoolsUI/slap')}>
                            gameplay slap
                        </Button>
                        <Button onClick={() => history.push('/intoolsUI/sound')}>
                            Joined Game Lobby sound
                        </Button>
                        <Button onClick={() => history.push('/intoolsUI/tiktok')}>
                            tiktok sound.
                        </Button>
                        <Button onClick={() =>{
                            this.setState({expUpdateModalOpen:true})
                            history.push('/intoolsUI/expUpdateModal')
                        }}>
                            expUpdateModal
                        </Button>
                        <Button onClick={() => history.push('/intoolsUI/rankingsList')}>
                            rankingsList
                        </Button>
                    </div>
                    <Switch>

                        <Route
                            path="/intoolsUI/gameplayTutorial"
                            exact={true}
                            render={() => (
                                <Modal
                                    isOpen={this.state.showTutorial}
                                    ariaHideApp={false}
                                    onRequestClose={() => {
                                        this.setState({showTutorial: false});
                                    }
                                    }
                                >
                                    <GamePlayTutorial
                                        myusername={"intools user"}
                                        onComplete={() => {
                                            this.setState({showTutorial: false});
                                        }}
                                    />
                                </Modal>
                                )}
                            />
                        <Route
                            path="/intoolsUI/ChatRoom"
                            exact={true}
                            render={() => (
                                <ChatRoom
                                    namespace={'berdoge'}
                                    messageFeed={sampleMessageFeed}
                                    onMessageSend={(val) => {
                                        sampleMessageFeed.push({
                                            sender_username: 'me',
                                            message: val,
                                            timestamp: 120318249,
                                            namespace: 'berdoge'
                                        });
                                        sampleMessageFeed.push({
                                            sender_username: 'cron job',
                                            message: `Messaging you @ ${new Date()}.`,
                                            timestamp: Date.now(),
                                            namespace: 'berdoge'
                                        });
                                    }
                                    }
                                    username={"me"}
                                />
                            )}
                        />
                        <Route
                            path="/intoolsUI/ScoreRankings"
                            exact={true}
                            render={() => (
                                <ScoreRankings
                                    finalscores={sampleFinalScores}
                                    winner={sampleFinalScores[5].username}
                                />
                            )

                            }
                        />
                        <Route
                            path={"/intoolsUI/tiktok"}
                            exact={true}
                            render={() => (
                                <div>
                                    <Sound
                                        url={SOUNDTYPES.gameplay.tikTok}
                                        playStatus={Sound.status.PLAYING}
                                        loop={true}
                                    />
                                    <p>
                                        These sounds are served from our frontend server. They are requested from the
                                        client, and loaded into the
                                        react-sound component ('Sound').

                                    </p>
                                </div>

                            )}
                        />
                        <Route
                            path={"/intoolsUI/sound"}
                            exact={true}
                            render={() => (
                                <div>
                                    <Sound
                                        url={SOUNDTYPES.lobby.joined}
                                        playStatus={Sound.status.PLAYING}
                                    />
                                    <p>
                                        These sounds are served from our frontend server. They are requested from the
                                        client, and loaded into the
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
                            render={() => (
                                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                                    <Sound
                                        url={SOUNDTYPES.gameplay.slapped}
                                        playStatus={Sound.status.PLAYING}
                                    />
                                    <div style={{marginLeft: '15px'}}>
                                        <h2>has slapped:</h2>
                                        <PlayingCard
                                            suit={"H"}
                                            number={12}
                                            hasSlapped={true}
                                        />
                                    </div>
                                    <div style={{marginRight: '15px'}}>
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
                            render={() => (
                                <ExpUpdateModal
                                    isOpen={this.state.expUpdateModalOpen}
                                    previousLevelIdx={5}
                                    previousExp={EXPLEVELS[5].threshold - 200}
                                    previousLevelObj={EXPLEVELS[5]}
                                    currentLevelIdx={8}
                                    currentExp={EXPLEVELS[8].start+ 400}
                                    currentLevelObj={EXPLEVELS[8]}
                                    onRequestClose={() =>{
                                        this.setState({expUpdateModalOpen: false})
                                    }}

                                />
                            )}
                        />

                        <Route
                            path={"/intoolsUI/rankingsList"}
                            exact={true}
                            render={() => (
                                <RankingsList

                                    rankings={[

                                        {username: 'berdog', level: 4, exp: 2000},
                                        {username: 'zaza', level: 8, exp: 9000},
                                        {username: 'willyking', level: 9, exp: 20000},
                                        {username: 'Terry', level: 9, exp: 25000},
                                        {username: 'Sucker', level: 0, exp: 10},

                                    ]}
                                />
                                )}
                        />
                        <Route render={() => (<h3 style={{alignSelf:'center'}}> Please select a UI component to continue.</h3>)}/>
                    </Switch>
                </div>
            </Router>
        );
    }
}
export default IntoolsUIRouter;

