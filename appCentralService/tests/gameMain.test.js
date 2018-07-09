//TESTS for our Game dashboard endpoints :
/*
Create user, login user,
create game, delete game.
tests for the behaviour as a person in the dashboard page.
 */
// make sure that appCS is online before running these tests!
require('dotenv').config({path: `../../shared/.development.local.env`});
require('dotenv').config({path: `${__dirname}/../.appcs.test.env`});
const dummydata = require('./dummydata/dummydata');
const request = require('request');
const assert = require('assert');
const ioclient = require('socket.io-client');
const db = require('../db/db');
const EVENTS = require('../constants/socketEvents');
const logger = require('../log/appcs_logger');
logger.info(`connection details-TEST`,`connection details : appcs: ${process.env.APPCS_HOST}:${process.env.APPCS_PORT}, gms: ${process.env.GMS_HOST}:${process.env.GMS_PORT}.`)
// our http endpoints..
// theyre fine.
// we do need to test our WS stuff initiated by the HTTP endpoints tho.
describe(' gameMain.test: LOGIN AND REGISTER routes',function() {
    after(function(done){
        db.deleteUser('willyboomboom').then(()=>{
            if(this.socket) //close socket connection.
                this.socket.close();
            done();
        }).catch((e)=>done(e));
    });

    it('after register, username and socket should be established in' +
        ' server db.', function (done) {
       console.log(`berdoge`); 
        console.log(`posting to http://localhost:${process.env.APPCS_PORT}/appcs/user/new`);
        request.post({
                url: `http://localhost:${process.env.APPCS_PORT}/appcs/user/new`,
                form: {
                    username: 'willyboomboom',
                    password: 'berdoge'
                },
            },
            (err, res, body) => {
            if(err) {
                console.log(`ERROR HERE`);
                done(err);
            }
                console.log(`posting successful`);
                console.log(`got body : ${JSON.stringify(body)}`);
                assert.equal(true,JSON.parse(body).success);
                const token = JSON.parse(body).token;
                console.log(`got token : ${token}`);

                this.socket = ioclient(`http://localhost:${process.env.APPCS_PORT}`, {
                        query: {
                            token: token
                        }
                    }
                );
                // Notice how we're not actually accessing the game creation http routes.
                // this is so that we can isolate testing (separate them into easily-debuggable
                // tests).
                setTimeout(() =>{ 
                done(new Error("time out reached"))}, 1500); //1500ms lmit for socket to establish
                // conn.
                this.socket.on('connect', () => {
                    logger.info('gameMain.test',`Socket connected and authenticated.`);
                    // WARNING: RACE CONDITION HERE!
                    db.getUserSecrets('willyboomboom').then((user) => {
                        assert.equal(user.username, 'willyboomboom');
                        assert.equal(user.gameid, null);
                        logger.info('test', `this.socket.id : ${this.socket.id}, user.socketid: ${user.socketid}`)
                        assert.equal(user.socketid, this.socket.id);
                        done();
                    }).catch((e) => done(e));
                });
            });
    });
    it('should not create duplicates', function (done) {
        request.post({
                url: `http://localhost:${process.env.APPCS_PORT}/appcs/user/new`,
                form: {
                    username: 'willyboomboom',
                    password: 'berdoge'
                },
            },
            (err, res, body) => {
                if (err) {
                    console.log(`ERROR HERE`);
                    done(err);
                }
                assert.equal(false, JSON.parse(body).success);
                const token = JSON.parse(body).token;
                assert.equal(undefined, token);
                assert.equal("User already exists.", JSON.parse(body).error);
                done();
            });
    });

    it(' login with wrong pw should be invalidated', function (done) {
        console.log(`posting to http://localhost:${process.env.APPCS_PORT}/appcs/user/auth`);
        request.post({
            url: `http://localhost:${process.env.APPCS_PORT}/appcs/user/auth`,
            form: {
                username: 'willyboomboom',
                password: 'berdogez' // wrong pw here.
            },
        },(err,res,body)=>{
             console.log(`login with wrong pw :Body: ${body}`);
            if(err)
                done(err);
            assert(JSON.parse(body).success === false);
            done();
        });
    });


});

describe(' gameMain.test: game creation and game deletion events (WS)',function() {
    before(function (done) {
        request.post({
                url: `http://localhost:${process.env.APPCS_PORT}/appcs/user/new`,
                form: {
                    username: 'willyboomboom',
                    password: 'berdoge'
                },
            },
            (err, res, body) => {
                if (err)
                    done(err);
                let token =  JSON.parse(body).token;
                this.token = token;
                this.socket = ioclient(`http://localhost:${process.env.APPCS_PORT}`, {
                    query: {
                        token: token
                    }
                });
                this.socket.on('connect', () => {
                    console.log(`Socket connected and authenticated.`);
                done();
            });
        });
    });

    after(function(done){
        db.deleteUser('willyboomboom').then(()=>{
            if(this.socket)
                this.socket.close();
            done();
        }).catch((e)=>done(e));
    });
    it('should receive game create updates',function(done) {
        let newgame = dummydata.newgame3;
        newgame.creator = 'willyboomboom';
        this.socket.on(EVENTS.GAME_CREATED, (data) => {
            const socket_sent_game = data.game;
            console.log(`sent game : ${JSON.stringify(socket_sent_game)}`);
            console.log('socket_sent_game.creator: ',socket_sent_game.creator);
            console.log('newgmae.creator: ',newgame.creator);

            assert.equal(socket_sent_game.creator, newgame.creator);
            assert.equal(socket_sent_game.name, newgame.name);
            assert.equal(socket_sent_game.players.length,0);
        });
        // TEST our create game endpoint here.
        request.post({
                url: `http://localhost:${process.env.APPCS_PORT}/appcs/game/create`,
                form: {
                    game: newgame,
                    token: this.token
                },
            },
            (err, res, body) => {
                if (err)
                    done(err);
                this.newgameuuid = JSON.parse(body).game.uuid;

                console.log(`${body}`);
                console.log(`CREATE game ok. `);
                done();
            });
    });

    it('should receive game delete updates ', function(done){
        this.socket.on(EVENTS.GAME_DELETED,(data)=>{
            assert.equal(data.gameuuid,this.newgameuuid);
            done();
        });
        if(this.newgameuuid === undefined)
            done(new Error("this.newgameuuid is undefined. Please run the whole gameMain.test.js, not just this on 'it'!"));
        // TEST our delete game endpoint here.
        request.delete({
                url: `http://localhost:${process.env.APPCS_PORT}/appcs/game/delete/${this.newgameuuid}`,
                form: {
                    socketid: this.socket.id,
                    token: this.token,
                },
            },
            (err, res, body) => {
                //if (err)
                   // done(new Error("not deleted!"));
                
                console.log(`got body: ${body}`);
                if(JSON.parse(body).success === false)
                    done(new Error("not deleted!"));
            })
        })
    });
describe(' gameMain.test: global chat ',function() {
    before(function (done) {
        request.post({
                url: `http://localhost:${process.env.APPCS_PORT}/appcs/user/new`,
                form: {
                    username: 'willyboomboom',
                    password: 'berdoge'
                },
            },
            (err, res, body) => {
                if (err)
                    done(err);
                let token = JSON.parse(body).token;
                this.token = token;
                this.socket = ioclient(`http://localhost:${process.env.APPCS_PORT}`, {
                    query: {
                        token: token
                    }
                });
                this.socket.on('connect', () => {
                    console.log(`Socket connected and authenticated.`);
                    request.post({
                            url: `http://localhost:${process.env.APPCS_PORT}/appcs/user/new`,
                            form: {
                                username: 'willywonka',
                                password: 'berdogezaza'
                            },
                        },
                        (err, res, body) => {
                            if (err)
                                done(err);
                            let token2 = JSON.parse(body).token;
                            this.token2 = token2;
                            this.socket2 = ioclient(`http://localhost:${process.env.APPCS_PORT}`, {
                                query: {
                                    token: token2
                                }
                            });
                            this.socket2.on('connect', () => {
                                console.log(`Socket2 connected and authenticated.`);
                                done();
                            });
                        });
                });
            });
    });
    after(function (done) {
        db.deleteUser('willyboomboom').then(() => {
            if (this.socket)
                this.socket.close();
            db.deleteUser('willywonka').then(() => {
                done();
            }).catch((e) => done(e));
        }).catch((e) => done(e));
    });
    it('should receive main room chat updates on both', function(done){
        let numrecv = 0;
        const onRecvMsg = (data)=>{
            assert.equal(data.sender_username  , 'willyboomboom');
            assert.equal(data.message , 'heyy wadup')
            assert.equal(data.namespace,null);
            logger.info('gameMain.test',`received message. namespace: ${data.namespace}`);
            numrecv++;
            if (numrecv === 2)
                done();
        };

        this.socket.on(EVENTS.RECV_CHAT_MSG,onRecvMsg);
        this.socket2.on(EVENTS.RECV_CHAT_MSG,onRecvMsg);
        this.socket.emit(EVENTS.EMIT_CHAT_MSG,{
            message:'heyy wadup',
            namespace:null,
            sender_username: 'willyboomboom'
        });

    })
});


