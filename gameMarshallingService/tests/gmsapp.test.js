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
    beforeEach(function(done){
        request.post({
            url: `http://localhost:${process.env.PORT}/gms/game/create`,
            form: {
                gamename: dummydata.gameGMStest.gamename,
                gameid: dummydata.gameGMStest.gameid,
                players: JSON.stringify(dummydata.gameGMStest.players)
            }
        },
            (err,res,body)=>{
                if(err)
                    done(new Error("request failed"));
                
                 const response = JSON.parse(body);

                console.log(`Got response : ${JSON.stringify(response)}`);
                 assert.equal(response.success,true);
                 this.gametoken = response.gametoken ;
                this.gamesecret = response.gamesecret;
                this.gamesessionid = response.gamesessionid;
                
                done();
            });
    });
    afterEach(function(done){
        if(this.player1socket)
            this.player1socket.close();
        if(this.player2socket)
            this.player2socket.close();
        if(this.player3socket)
            this.player3socket.close();
        redisdb.deleteGame(this.gamesessionid).then(()=>{
            done();
        }).catch(e=>done(e));
    })
    it('should deny invalid tokens or gamesecrets', function (done) {
        this.player1socket = ioclient(`http://localhost:${process.env.PORT}`, {
            query: {
                token: this.gametoken + "goijwdoijawodijawd",
                gamesecret: this.gamesecret,
                username:"mallory"
            }
        });
        this.player1socket.on('connect',()=>{
            done(new Error("player 1 socket did connect even though wrong token!"));
        })
        // player 1 socket should be denied.
            redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers)=>{
                assert.equal(connectedPlayers.length,0);
                this.player1socket.close();
                this.player2socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: this.gametoken,
                        gamesecret: this.gamesecret+ "120eijdaoinklawd",
                        username:"malicious_user"
                    }
                });
                this.player2socket.on('connect',()=>{
                    done(new Error("player 2 socket did connect even though wrong gamesecret!"));
                })
                redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers2)=>{
                    // player 1 socket should be denied again.
                    assert.equal(connectedPlayers2.length,0);
                    this.player2socket.close();
                    this.player1socket = ioclient(`http://localhost:${process.env.PORT}`, {
                        query: {
                            token: this.gametoken,
                            gamesecret: this.gamesecret,
                            username: dummydata.gameGMStest.players[0]
                        }
                    });
                    this.player1socket.on('connect',()=>{
                        redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers3)=>{
                            assert.equal(connectedPlayers3.length,1);
                            this.player2socket = ioclient(`http://localhost:${process.env.PORT}`, {
                                query: {
                                    token: this.gametoken,
                                    gamesecret: this.gamesecret,
                                    username: dummydata.gameGMStest.players[1]
                                }
                            });
                            this.player2socket.on('connect',()=>{
                                redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers4)=>{
                                    assert.equal(connectedPlayers4.length,2);
                                    this.player3socket = ioclient(`http://localhost:${process.env.PORT}`, {
                                        query: {
                                            token: this.gametoken,
                                            gamesecret: this.gamesecret,
                                            username: dummydata.gameGMStest.players[2]
                                        }
                                    });
                                    this.player3socket.on('connect',()=>{
                                        redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers5)=>{
                                            assert.equal(connectedPlayers5.length,3);
                                            dummydata.gameGMStest.players.forEach((player)=> {
                                                assert.notEqual(connectedPlayers5.indexOf(player), -1);
                                            });
                                            done();
                                        }).catch(e=>done(e));
                                    });
                                }).catch(e=>done(e));
                            });
                        }).catch(e=>done(e));
                });
            }).catch(e=>done(e));
        })
        })

    it('should only start when all sockets connect (receive game start event)', function (done) {
        let allConnected= false;
        this.player1socket = ioclient(`http://localhost:${process.env.PORT}`, {
            query: {
                token: this.gametoken,
                gamesecret: this.gamesecret,
                username: dummydata.gameGMStest.players[0]
            }
        });
        this.player1socket.on((events.GAME_START),(data)=>{
            if(!allConnected){
                done(new Error("player 1 received game start even though not started yet."))
            }
        })
            this.player1socket.on('connect', ()=>{
                redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers3)=>{
                    assert.equal(connectedPlayers3.length,1);
                    this.player2socket = ioclient(`http://localhost:${process.env.PORT}`, {
                        query: {
                            token: this.gametoken,
                            gamesecret: this.gamesecret,
                            username: dummydata.gameGMStest.players[1]
                        }
                    });
                    this.player2socket.on((events.GAME_START),(data)=>{
                        if(!allConnected){
                            done(new Error("player 2 received game start even though not started yet."))
                        }
                    })
                    this.player2socket.on('connect',()=>{
                        redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers4)=>{
                            assert.equal(connectedPlayers4.length,2);
                            allConnected = true;
                            this.player3socket = ioclient(`http://localhost:${process.env.PORT}`, {
                                query: {
                                    token: this.gametoken,
                                    gamesecret: this.gamesecret,
                                    username: dummydata.gameGMStest.players[2]
                                }
                            });
                            this.player3socket.on('connect',()=>{
                                this.player3socket.on((events.GAME_START),(data)=>{
                                    if(!allConnected){
                                        done(new Error("player 3 received game start even though not started yet."))
                                    }
                                })
                                redisdb.getConnectedPlayers(this.gamesessionid).then((connectedPlayers5)=>{
                                    assert.equal(connectedPlayers5.length,3);
                                    dummydata.gameGMStest.players.forEach((player)=> {
                                        assert.notEqual(connectedPlayers5.indexOf(player), -1);
                                    });
                                    done();
                                }).catch(e=>done(e));
                            });
                    }).catch(e=>done(e));
                });
            }).catch(e=>done(e));
        })
    });
});

describe('gmsapp.test: registering throw', function () {
    beforeEach(function(done){
        request.post({
                url: `http://localhost:${process.env.PORT}/gms/game/create`,
                form: {
                    gamename: dummydata.gameGMStest.gamename,
                    gameid: dummydata.gameGMStest.gameid,
                    players: JSON.stringify(dummydata.gameGMStest.players)
                }
            },
            (err,res,body)=>{
                if(err)
                    done(new Error("request failed"));

                const response = JSON.parse(body);

                console.log(`Got response : ${JSON.stringify(response)}`);
                assert.equal(response.success,true);
                this.gametoken = response.gametoken ;
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
    afterEach(function(done){
        if(this.player1socket)
            this.player1socket.close();
        if(this.player2socket)
            this.player2socket.close();
        if(this.player3socket)
            this.player3socket.close();
        redisdb.deleteGame(this.gamesessionid).then(()=>{
            done();
        }).catch(e=>done(e));
    })

    it('should only register throws for player in turn, and should be in pile', function (done) {
        //TODO: make sure that the cards here don't match!
        redisdb.getCurrentTurn(this.gamesessionid).then((turn)=>{
            // should be player 1 who is in turn
            assert.equal(turn.playerinturn,dummydata.gameGMStest.players[0]);
            assert.equal(turn.currentcounter, 0);
            console.log(`player 3 throwing...`);
            this.player3socket.emit(events.PLAYER_THREW,{},(response)=>{
                console.log(`got response from player3`);
                assert.equal(response.success,false);
                this.player2socket.emit(events.PLAYER_THREW,{},(response)=>{
                    assert.equal(response.success,false);
                    this.player1socket.emit(events.PLAYER_THREW,{},(response)=>{
                        assert.equal(response.success,true);
                        redisdb.getCurrentTurn(this.gamesessionid).then((turn)=>{
                            assert.equal(turn.playerinturn,dummydata.gameGMStest.players[1]);
                            assert.equal(turn.currentcounter, 1);
                            this.player2socket.emit(events.PLAYER_THREW,{}, (response) => {
                                assert.equal(response.success,true);
                                redisdb.getCurrentTurn(this.gamesessionid).then((turn)=>{
                                    assert.equal(turn.playerinturn,dummydata.gameGMStest.players[2]);
                                    assert.equal(turn.currentcounter, 2);
                                    this.player3socket.emit(events.PLAYER_THREW,{}, (response) => {
                                        assert.equal(response.success,true);
                                        redisdb.getCurrentTurn(this.gamesessionid).then((turn)=>{
                                            assert.equal(turn.playerinturn,dummydata.gameGMStest.players[0]);
                                            assert.equal(turn.currentcounter, 3);
                                            done();
                                        }).catch(e=>done(e));
                                    });
                                }).catch(e=>done(e));
                            });
                        }).catch(e=>done(e));
                    });
                });
            });
            // we havent started throwing, so counter should be 0.
        })

    });
});

describe('gmsapp.test: match', function () {
    it('should only match if card == (counter % 13) + 1 ', function (done) {
        done();
      //note. we're going to have to edit (illegally) the pile so that they here. this is where redisdb comes into play.
        // this wont happen in real games.
    });
    it('should not register throws for match event', function (done) {
        done();

    });
});

describe('gmsapp.test: slaps', function () {
    it('should register and punish false alarm slaps', function (done) {
        done();
    });
    it('should register slaps during match, and last one to slap (loser) gets punished', function (done) {
        done();

    });
});