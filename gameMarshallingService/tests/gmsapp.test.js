require('dotenv').config({path: `${__dirname}/../.gms.test.env`});
const dummydata = require('./dummydata/dummydata');
const request = require('request');
const assert = require('assert');
const ioclient = require('socket.io-client');
const redisdb = require('../db/redisdb');
const events = require('../constants/socketEvents');
/*
notes:

connecting ioclient:


this.socket = ioclient(`http://localhost:${process.env.PORT}`, {
    query: {
        token: token,
        gamesecret: "ROOMSECRET HERE"
    }
});
// then just register your events.
socket.on(... .


 */
describe('gmsapp.test: initial connection to game', function () {
    beforeEach(function (done) {
        request.post({
                url: `http://localhost:${process.env.PORT}/gms/game/create`,
                form: {
                    gamename: dummydata.gameGMStest.gamename,
                    gameid: dummydata.gameGMStest.gameid,
                    players: JSON.stringify(dummydata.gameGMStest.players)
                }
            },
            (err, res, body) => {
                if (err)
                    done(new Error("request failed"));

                const response = JSON.parse(body);

                console.log(`Got response : ${JSON.stringify(response)}`);
                assert.equal(response.success, true);
                this.gametoken = response.gametoken;
                this.gamesecret = response.gamesecret;
                this.gamesessionid = response.gamesessionid;
                done();
            });
    });
    afterEach(function (done) {
        if (this.player1socket)
            this.player1socket.close();
        if (this.player2socket)
            this.player2socket.close();
        if (this.player3socket)
            this.player3socket.close();
        redisdb.deleteGame(this.gamesessionid).then(() => {
            done();
        }).catch(e => done(e));
    })
    it('should deny invalid tokens or gamesecrets', function (done) {
        this.player1socket = ioclient(`http://localhost:${process.env.PORT}`, {
            query: {
                token: this.gametoken + "goijwdoijawodijawd",
                gamesecret: this.gamesecret,
                username: "mallory"
            }
        });
        this.player1socket.on('connect', () => {
            done(new Error("player 1 socket did connect even though wrong token!"));
        });
        // player 1 socket should be denied.
        redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers) => {
            assert.equal(connectedPlayers.length, 0);
            this.player1socket.close();
            this.player2socket = ioclient(`http://localhost:${process.env.PORT}`, {
                query: {
                    token: this.gametoken,
                    gamesecret: this.gamesecret + "120eijdaoinklawd",
                    username: "malicious_user"
                }
            });
            this.player2socket.on('connect', () => {
                done(new Error("player 2 socket did connect even though wrong gamesecret!"));
            });
            redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers2) => {
                // player 1 socket should be denied again.
                assert.equal(connectedPlayers2.length, 0);
                this.player2socket.close();
                this.player1socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: this.gametoken,
                        gamesecret: this.gamesecret,
                        username: dummydata.gameGMStest.players[0]
                    }
                });
                this.player1socket.on('connect', () => {
                    redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers3) => {
                        assert.equal(connectedPlayers3.length, 1);
                        this.player2socket = ioclient(`http://localhost:${process.env.PORT}`, {
                            query: {
                                token: this.gametoken,
                                gamesecret: this.gamesecret,
                                username: dummydata.gameGMStest.players[1]
                            }
                        });
                        this.player2socket.on('connect', () => {
                            redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers4) => {
                                assert.equal(connectedPlayers4.length, 2);
                                this.player3socket = ioclient(`http://localhost:${process.env.PORT}`, {
                                    query: {
                                        token: this.gametoken,
                                        gamesecret: this.gamesecret,
                                        username: dummydata.gameGMStest.players[2]
                                    }
                                });
                                this.player3socket.on('connect', () => {
                                    redisdb.getConnectedPlayers(this.gamesessionid).then(connectedPlayers5 => {
                                        assert.equal(connectedPlayers5.length, 3);
                                        dummydata.gameGMStest.players.forEach(player => {
                                            assert.notEqual(connectedPlayers5.indexOf(player), -1);
                                        });
                                        done();
                                    }).catch(e => done(e));
                                });
                            }).catch(e => done(e));
                        });
                    }).catch(e => done(e));
                });
            }).catch(e => done(e));
        })
    })

    it('should only start when all sockets connect (receive game start event)', function (done) {
        let allConnected = false;
        this.player1socket = ioclient(`http://localhost:${process.env.PORT}`, {
            query: {
                token: this.gametoken,
                gamesecret: this.gamesecret,
                username: dummydata.gameGMStest.players[0]
            }
        });
        this.player1socket.on(events.GAME_START, (data) => {
            if (!allConnected) {
                done(new Error("player 1 received game start even though not started yet."))
            }
        })
        this.player1socket.on('connect', () => {
            redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers3) => {
                assert.equal(connectedPlayers3.length, 1);
                this.player2socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: this.gametoken,
                        gamesecret: this.gamesecret,
                        username: dummydata.gameGMStest.players[1]
                    }
                });
                this.player2socket.on((events.GAME_START), (data) => {
                    if (!allConnected) {
                        done(new Error("player 2 received game start even though not started yet."))
                    }
                })
                this.player2socket.on('connect', () => {
                    redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers4) => {
                        assert.equal(connectedPlayers4.length, 2);
                        allConnected = true;
                        this.player3socket = ioclient(`http://localhost:${process.env.PORT}`, {
                            query: {
                                token: this.gametoken,
                                gamesecret: this.gamesecret,
                                username: dummydata.gameGMStest.players[2]
                            }
                        });
                        this.player3socket.on('connect', () => {
                            this.player3socket.on((events.GAME_START), (data) => {
                                if (!allConnected) {
                                    done(new Error("player 3 received game start even though not started yet."))
                                }
                            })
                            redisdb.getConnectedPlayers(this.gamesessionid).then(connectedPlayers5 => {
                                assert.equal(connectedPlayers5.length, 3);
                                dummydata.gameGMStest.players.forEach((player) => {
                                    assert.notEqual(connectedPlayers5.indexOf(player), -1);
                                });
                                done();
                            }).catch(e => done(e));
                        });
                    }).catch(e => done(e));
                });
            }).catch(e => done(e));
        })
    });
});

describe('gmsapp.test: registering throw', function () {
    beforeEach(function (done) {
        request.post({
                url: `http://localhost:${process.env.PORT}/gms/game/create`,
                form: {
                    gamename: dummydata.gameGMStest.gamename,
                    gameid: dummydata.gameGMStest.gameid,
                    players: JSON.stringify(dummydata.gameGMStest.players)
                }
            },
            (err, res, body) => {
                if (err)
                    done(new Error("request failed"));

                const response = JSON.parse(body);

                console.log(`Got response : ${JSON.stringify(response)}`);
                assert.equal(response.success, true);
                this.gametoken = response.gametoken;
                this.gamesecret = response.gamesecret;
                this.gamesessionid = response.gamesessionid;

                this.player1socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: this.gametoken,
                        gamesecret: this.gamesecret,
                        username: dummydata.gameGMStest.players[0]
                    }
                });
                this.player2socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: this.gametoken,
                        gamesecret: this.gamesecret,
                        username: dummydata.gameGMStest.players[1]
                    }
                });
                this.player3socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: this.gametoken,
                        gamesecret: this.gamesecret,
                        username: dummydata.gameGMStest.players[2]
                    }
                });
                done();
            });
    });
    afterEach(function (done) {
        if (this.player1socket)
            this.player1socket.close();
        if (this.player2socket)
            this.player2socket.close();
        if (this.player3socket)
            this.player3socket.close();
        redisdb.deleteGame(this.gamesessionid).then(() => {
            done();
        }).catch(e => done(e));
    })
    it('should only register throws for player in turn, and should be in pile', function (done) {
        redisdb.getCurrentTurn(this.gamesessionid).then((turn) => {
            // should be player 1 who is in turn
            assert.equal(turn.playerinturn, dummydata.gameGMStest.players[0]);
            assert.equal(turn.currentcounter, 0);
            this.player3socket.emit(events.PLAYER_THREW, {}, (response) => {
                assert.equal(response.success, false);
                this.player2socket.emit(events.PLAYER_THREW, {}, (response) => {
                    assert.equal(response.success, false);
                    this.player1socket.emit(events.PLAYER_THREW, {}, (response) => {
                        assert.equal(response.success, true);
                        redisdb.getCurrentTurn(this.gamesessionid).then((turn) => {
                            assert.equal(turn.playerinturn, dummydata.gameGMStest.players[1]);
                            assert.equal(turn.currentcounter, 1);
                            redisdb.getPile(this.gamesessionid).then((pile) => {
                                const top = pile.pop();
                                if (top === turn.currentcounter) {
                                    console.log(`early match for counter: ${top}`);
                                    done(); // matches.
                                }
                            }).catch(e => done(e));
                            this.player2socket.emit(events.PLAYER_THREW, {}, (response) => {
                                assert.equal(response.success, true);
                                redisdb.getCurrentTurn(this.gamesessionid).then((turn) => {
                                    assert.equal(turn.playerinturn, dummydata.gameGMStest.players[2]);
                                    assert.equal(turn.currentcounter, 2);
                                    redisdb.getPile(this.gamesessionid).then((pile) => {
                                        const top = pile.pop();
                                        if (top === turn.currentcounter) {
                                            console.log(`early match for counter: ${top}`);
                                            done(); // matches.
                                        }
                                    }).catch(e => done(e));
                                    this.player3socket.emit(events.PLAYER_THREW, {}, (response) => {
                                        assert.equal(response.success, true);
                                        redisdb.getCurrentTurn(this.gamesessionid).then((turn) => {
                                            assert.equal(turn.playerinturn, dummydata.gameGMStest.players[0]);
                                            assert.equal(turn.currentcounter, 3);
                                            redisdb.getPile(this.gamesessionid).then((pile) => {
                                                const top = pile.pop();
                                                if (top === turn.currentcounter) {
                                                    console.log(`early match for counter: ${top}`);
                                                    done(); // matches.
                                                }
                                            }).catch(e => done(e));
                                            done();
                                        }).catch(e => done(e));
                                    });
                                }).catch(e => done(e));
                            });
                        }).catch(e => done(e));
                    });
                });
            });
            // we havent started throwing, so counter should be 0.
        })

    });
});


describe('gmsapp.test: match', function () {
    beforeEach(function (done) {
        request.post({
                url: `http://localhost:${process.env.PORT}/gms/game/create`,
                form: {
                    gamename: dummydata.gameGMStest.gamename,
                    gameid: dummydata.gameGMStest.gameid,
                    players: JSON.stringify(dummydata.gameGMStest.players)
                }
            },
            (err, res, body) => {
                if (err)
                    done(new Error("request failed"));

                const response = JSON.parse(body);
                console.log(`Got response : ${JSON.stringify(response)}`);
                assert.equal(response.success, true);
                this.gametoken = response.gametoken;
                this.gamesecret = response.gamesecret;
                this.gamesessionid = response.gamesessionid;

                this.player1socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: this.gametoken,
                        gamesecret: this.gamesecret,
                        username: dummydata.gameGMStest.players[0]
                    }
                });
                this.player2socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: this.gametoken,
                        gamesecret: this.gamesecret,
                        username: dummydata.gameGMStest.players[1]
                    }
                });
                this.player3socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: this.gametoken,
                        gamesecret: this.gamesecret,
                        username: dummydata.gameGMStest.players[2]
                    }
                });
                done();
            });
    });
    afterEach(function (done) {
        if (this.player1socket)
            this.player1socket.close();
        if (this.player2socket)
            this.player2socket.close();
        if (this.player3socket)
            this.player3socket.close();
        redisdb.deleteGame(this.gamesessionid).then(() => {
            done();
        }).catch(e => done(e));
    })


    //note. we're going to have to edit (illegally) the pile so that they here. this is where redisdb comes into play.
    // this wont happen in real games.
    it('should only match if card == (counter % 13) ', function (done) {
        let card = 3;
        // player 3 will trigger the match event.
        this.player1socket.on(events.NEXT_TICK,(tick)=>{
            console.log(`player 1 got tick: ${JSON.stringify(tick)}`);
            if(tick.match){
                if(tick.counter === card)
                    done();
                else
                    done(new Error(`next counter ${tick.counter} != ${card}`));
            }
        });

        this.player2socket.on(events.NEXT_TICK,(tick)=>{
            console.log(`player 2 got tick: ${JSON.stringify(tick)}`);
            if(tick.match){
                if(tick.counter === card && tick.nextplayer === dummydata.gameGMStest.players[0])
                    done();
                else
                    done(new Error(`next counter ${tick.counter} != ${card}`));
            }
        });
        this.player3socket.on(events.NEXT_TICK,(tick)=>{
            console.log(`player 3 got tick: ${JSON.stringify(tick)}`);
            if(tick.match){
                    if(tick.counter === card && tick.nextplayer === dummydata.gameGMStest.players[0])
                    done();
                else
                    done(new Error(`next counter ${tick.counter} != ${card}`));
            }
        });

        redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[0],10).then(()=>{
            redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[1],9).then(()=>{
                redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[2],card).then(()=>{
                    this.player1socket.emit(events.PLAYER_THREW,{},(res)=>{
                        assert.equal(res.success, true);
                        this.player2socket.emit(events.PLAYER_THREW,{},(res)=>{
                            assert.equal(res.success, true);
                            this.player3socket.emit(events.PLAYER_THREW,{},(res)=>{
                                assert.equal(res.success, true);
                            });
                        });
                    })
                }).catch(e=>done(e));
            }).catch(e=>done(e));
        }).catch(e=>done(e));
    });
    it('should not register throws for match event', function (done) {
        let card = 3;
        // player 3 will trigger the match event.
        this.player1socket.on(events.NEXT_TICK,(tick)=>{
            console.log(`player 1 got tick: ${JSON.stringify(tick)}`);
            if(tick.match){
                if(tick.counter !== card)
                    done(new Error(`next counter ${tick.counter} != ${card}`));
            }
        });

        this.player2socket.on(events.NEXT_TICK,(tick)=>{
            console.log(`player 2 got tick: ${JSON.stringify(tick)}`);
            if(tick.match){
                if(tick.counter !== card)
                    done(new Error(`next counter ${tick.counter} != ${card}`));
            }
        });
        this.player3socket.on(events.NEXT_TICK,(tick)=>{
            console.log(`player 3 got tick: ${JSON.stringify(tick)}`);
            if(tick.match){
                    if(tick.counter !== card)
                    done(new Error(`next counter ${tick.counter} != ${card}`));
            }
        });

        redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[0],10).then(()=>{
            redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[1],9).then(()=>{
                redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[2],card).then(()=>{
                    this.player1socket.emit(events.PLAYER_THREW,{},(res)=>{
                        assert.equal(res.success, true);
                        this.player2socket.emit(events.PLAYER_THREW,{},(res)=>{
                            assert.equal(res.success, true);
                            this.player3socket.emit(events.PLAYER_THREW,{},(res)=>{
                                assert.equal(res.success, true);
                                this.player3socket.emit(events.PLAYER_THREW,{},(res)=>{
                                    assert.equal(res.success,false);
                                    assert.equal(res.error,"not your turn!");
                                    this.player1socket.emit(events.PLAYER_THREW,{},(res)=>{
                                        assert.equal(res.success,false);
                                        assert.equal(res.error,"is currently in match");
                                    done();
                                })
                                })
                            });
                        });
                    })
                }).catch(e=>done(e));
            }).catch(e=>done(e));
        }).catch(e=>done(e));
    });
});

describe('gmsapp.test: slaps', function () {
    beforeEach(function (done) {
        request.post({
                url: `http://localhost:${process.env.PORT}/gms/game/create`,
                form: {
                    gamename: dummydata.gameGMStest.gamename,
                    gameid: dummydata.gameGMStest.gameid,
                    players: JSON.stringify(dummydata.gameGMStest.players)
                }
            },
            (err, res, body) => {
                if (err)
                    done(new Error("request failed"));

                const response = JSON.parse(body);
                console.log(`Got response : ${JSON.stringify(response)}`);
                assert.equal(response.success, true);
                this.gametoken = response.gametoken;
                this.gamesecret = response.gamesecret;
                this.gamesessionid = response.gamesessionid;

                this.player1socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: this.gametoken,
                        gamesecret: this.gamesecret,
                        username: dummydata.gameGMStest.players[0]
                    }
                });
                this.player2socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: this.gametoken,
                        gamesecret: this.gamesecret,
                        username: dummydata.gameGMStest.players[1]
                    }
                });
                this.player3socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: this.gametoken,
                        gamesecret: this.gamesecret,
                        username: dummydata.gameGMStest.players[2]
                    }
                });
                done();
            });
    });
    afterEach(function (done) {
        if (this.player1socket)
            this.player1socket.close();
        if (this.player2socket)
            this.player2socket.close();
        if (this.player3socket)
            this.player3socket.close();
        redisdb.deleteGame(this.gamesessionid).then(() => {
            done();
        }).catch(e => done(e));
    })
    it('should register and punish false alarm slaps', function (done) {
        // when there is 3 on the pile, player 1 will falsely slap (slap on non-match
        // event). player 1 should be the one punished.

        this.player1socket.on(events.MATCH_RESULT, (result)=>{
            console.log(`player 1 got match result: ${JSON.stringify(result)}`);
            assert.equal(result.loser,dummydata.gameGMStest.players[0]);
            assert.equal(result.nextplayer,dummydata.gameGMStest.players[0]);
            assert.equal(result.loserAddToPile,3);
            done();
        });
        this.player2socket.on(events.MATCH_RESULT, (result)=>{
            console.log(`player 2 got match result: ${JSON.stringify(result)}`);
            assert.equal(result.loser,dummydata.gameGMStest.players[0]);
            assert.equal(result.nextplayer,dummydata.gameGMStest.players[0]);
            assert.equal(result.loserAddToPile,3);
            done();
        });

        this.player3socket.on(events.MATCH_RESULT, (result)=>{
            console.log(`player 3 got match result: ${JSON.stringify(result)}`);
            assert.equal(result.loser,dummydata.gameGMStest.players[0]);
            assert.equal(result.nextplayer,dummydata.gameGMStest.players[0]);
            assert.equal(result.loserAddToPile,3);
            done();
        });
        redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[0],10).then(()=>{
            redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[1],9).then(()=>{
                redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[2],8).then(()=>{
                    this.player1socket.emit(events.PLAYER_THREW,{},(res)=>{
                        assert.equal(res.success,true);
                        this.player2socket.emit(events.PLAYER_THREW,{},(res)=>{
                            assert.equal(res.success,true);
                            this.player3socket.emit(events.PLAYER_THREW,{},(res)=>{
                                assert.equal(res.success,true);
                               this.player1socket.emit(events.PLAYER_SLAPPED,{reactiontime: 0.123},(res)=>{
                                   console.log(`player 1 got slapped response: ${JSON.stringify(res)}`);

                                    assert.equal(res.success,true);
                                    assert.equal(res.consequence, "you slapped when not in match!")
                               }) ;
                            })
                        })
                    })
                }).catch(e=>done(e));
            }).catch(e=>done(e));
        }).catch(e=>done(e));
    });
    it('should register slaps during match, and last one to slap (loser) gets punished', function (done) {
        // here, player[0] is the  last one to slap.
        matchcard = 6;
        // this is the loser.
        this.player1socket.on(events.MATCH_RESULT, (result)=>{
            console.log(`player 1 got match result: ${JSON.stringify(result)}`);
            assert.equal(result.loser,dummydata.gameGMStest.players[0]);
            assert.equal(result.nextplayer,dummydata.gameGMStest.players[0]);
            assert.equal(result.loserAddToPile,6);
            done();
        });
        this.player1socket.on(events.NEXT_TICK,(tick)=>{
            if(tick.match){
                if(tick.counter === matchcard){
                    console.log(`player 1 got match next tick for counter ${tick.counter} === match card${matchcard}`);
                    setTimeout(()=>{
                        this.player1socket.emit(events.PLAYER_SLAPPED,{reactiontime:0.700 },(resobj)=>{
                            assert.equal(resobj.success,true);

                        });
                    },700);
                }else{
                    done(new Error(`tick ${tick.counter} doesn't match with card num ${matchcard}`))
                }
            }
        })

        this.player2socket.on(events.MATCH_RESULT, (result)=>{
            console.log(`player 2 got match result: ${JSON.stringify(result)}`);
            assert.equal(result.loser,dummydata.gameGMStest.players[0]);
            assert.equal(result.nextplayer,dummydata.gameGMStest.players[0]);
            assert.equal(result.loserAddToPile,6);
            done();
        });
        this.player2socket.on(events.NEXT_TICK,(tick)=>{
            if(tick.match){
                if(tick.counter === matchcard){

                    console.log(`player 2 got match next tick for counter ${tick.counter} === match card${matchcard}`);
                    setTimeout(()=>{
                        this.player2socket.emit(events.PLAYER_SLAPPED,{reactiontime:0.500 },(resobj)=>{
                            assert.equal(resobj.success,true);
                        });
                    },500);
                }else{
                    done(new Error(`tick ${tick.counter} doesn't match with card num ${matchcard}`))
                }
            }
        })

        this.player3socket.on(events.MATCH_RESULT, (result)=> {
            console.log(`player 3 got match result: ${JSON.stringify(result)}`);
            assert.equal(result.loser, dummydata.gameGMStest.players[0]);
            assert.equal(result.nextplayer, dummydata.gameGMStest.players[0]);
            assert.equal(result.loserAddToPile, 6);
            done();
        });
        this.player3socket.on(events.NEXT_TICK,(tick)=>{
                if(tick.match){
                    if(tick.counter === matchcard){
                        console.log(`player 3 got match next tick for counter ${tick.counter} === match card${matchcard}`);
                        setTimeout(()=>{
                            this.player3socket.emit(events.PLAYER_SLAPPED,{reactiontime:0.200 },(resobj)=>{
                                assert.equal(resobj.success,true);
                            });
                        },200);
                    }else{
                        done(new Error(`tick ${tick.counter} doesn't match with card num ${matchcard}`))
                    }
                }
            });

        redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[0],10).then(()=>{
            redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[0],10).then(()=>{
                redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[1],9).then(()=>{
                    redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[1],9).then(()=>{
                        redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[2],matchcard).then(()=>{
                            redisdb.utils.addToHand(this.gamesessionid,dummydata.gameGMStest.players[2],10).then(()=>{ // this is the match.
                                this.player1socket.emit(events.PLAYER_THREW,{},(res)=>{
                                    assert.equal(res.success,true);
                                    this.player2socket.emit(events.PLAYER_THREW,{},(res)=>{
                                        assert.equal(res.success,true);
                                        this.player3socket.emit(events.PLAYER_THREW,{},(res)=>{
                                            assert.equal(res.success,true);
                                            this.player1socket.emit(events.PLAYER_THREW,{},(res)=>{
                                                assert.equal(res.success,true);
                                                this.player2socket.emit(events.PLAYER_THREW,{},(res)=>{
                                                    assert.equal(res.success,true);
                                                    this.player3socket.emit(events.PLAYER_THREW,{},(res)=>{
                                                        //match here.
                                                        assert.equal(res.success,true);
                                                        this.player1socket.emit(events.PLAYER_THREW,{},(res)=>{
                                                            // cannot throw when already match
                                                            assert.equal(res.success,false);
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                }).catch(e=>done(e));
            }).catch(e=>done(e));
        }).catch(e=>done(e));
    });
});