//TESTS for actual joining of game lobbies.
//NOTE: be sure that our appCS is actually running.
require('dotenv').config({path: `${__dirname}/../.appcs.test.env`});
const dummydata = require('./dummydata/dummydata');
const request = require('request');
const assert = require('assert');
const ioclient = require('socket.io-client');
const db = require('../db/db');
const EVENTS = require('../constants/socketEvents');
const logger = require('../log/appcs_logger');
//NOTE: due to heavy DB testing we don't really need to test
//TODO: THIS IS WRONG! we do need to test our endpoints..
// our http endpoints..
// theyre fine.
// we do need to test our WS stuff initiated by the HTTP endpoints tho.
/*
tests:
- joining  lobby
- reaction to other people joining
     - should see change reflected.
- leaving lobby
- reaction to other people leaving
     - should see change reflected.
*/
describe(' gameLobby.test: lobby joinning & leaving.',function() {
    /* Before function creates the user (willyboomboom) and the a game. namely,
     dummydata.newgame3
     after before() executes, we get:
     this.newgameuuid : the game that we just created and will join.
     this.socket // our socket object.

    */
    before(function (done) {
        request.post({
                url: `http://localhost:${process.env.PORT}/appcs/user/new`,
                form: {
                    username: 'willyboomboom',
                    password: 'berdoge'
                },
            },
            (err, res, body) => {
                if (err)
                    done(err);

                let token =  JSON.parse(body).token;
                logger.info("beforeAll hook",`received body value : ${body}`)
                this.token = token;
                this.socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: token
                    }
                });
                this.socket.on('connect', () => {
                    console.log(`Socket connected and authenticated.`);
                    let newgame = dummydata.newgame3;
                    newgame.creator = 'willyboomboom';

                    db.createGame(dummydata.newgame3).then((newgame3)=>{
                        this.newgameuuid = newgame3.uuid;
                        done();
                    }).catch((e)=>done(e));
                });
            });
    });
    after(function(done){
        db.deleteUser('willyboomboom').then(()=>{
            if(this.socket)
                this.socket.close();
            db.deleteGame(this.newgameuuid).then(()=>{
                done();
            }).catch((e)=>done(e));
        }).catch((e)=>done(e));
    });

    it('should be able to join a lobby and socket "rooms" should be changed.',function(done){
        this.socket.emit(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN,{username:'willyboomboom',gameid:this.newgameuuid }, (result)=>{
            console.log(`attempt join emitted. in callback.`);
            this.socket.emit(EVENTS.UTILS.CHECK_ROOM,null,(joinedrooms)=>{
                console.log(`this game's uuid (room name) : ${this.newgameuuid}`);
                assert.equal(result.msg,EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_ACK);
                assert.equal(this.newgameuuid,joinedrooms[this.newgameuuid]);
                done();
            })
        })
    });
    it('shouldnt be able to join again when already joined a room, or if ' +
        'mal-formed request.',function(done){
        this.socket.emit(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN,{username:'willyboomboom',gameid:this.newgameuuid }, (result)=>{
            // willyboomboom already in.
            assert.equal(result,EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
            this.socket.emit(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN,{username:'mallory',gameid:"a15ca4cd-df43-4928-zz33-525c75fae103"},(result2)=>{
                // no such game.
                assert.equal(result2,EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
                this.socket.emit(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN,{username:'willyboomboom',gameid:"LALALA"},(result3)=>{
                       assert.equal(result3,EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
                        done();
                    });
                });
        });
    });
    it('should be able to leave a lobby and socket "rooms" should be changed.',function(done){
        this.socket.emit(EVENTS.LOBBY.CLIENT_LEAVE,{username:'willyboomboom',gameid:this.newgameuuid }, (result)=>{
            this.socket.emit(EVENTS.UTILS.CHECK_ROOM,null,(joinedrooms)=>{
                assert.equal(result,EVENTS.LOBBY.CLIENT_LEAVE_ACK);
              console.log(`current game : ${this.newgameuuid}`); 
               console.log(`joined rooms : ${JSON.stringify(joinedrooms)}`); 
                assert.equal(undefined,joinedrooms[this.newgameuuid]);
                assert.equal(Object.keys(joinedrooms).length,1); // only the main room now.
                done();
            })
        })
    });
});


describe('gameLobby.test: Lobby chat ',function (){
    before(function (done) {
        request.post({
                url: `http://localhost:${process.env.PORT}/appcs/user/new`,
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
                this.socket = ioclient(`http://localhost:${process.env.PORT}`, {
                    query: {
                        token: token
                    }
                });
                this.socket.on('connect', () => {
                    console.log(`Socket connected and authenticated.`);
                    /* Socket 2 register */
                    request.post({
                            url: `http://localhost:${process.env.PORT}/appcs/user/new`,
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
                            this.socket2 = ioclient(`http://localhost:${process.env.PORT}`, {
                                query: {
                                    token: token2
                                }
                            });
                            this.socket2.on('connect', () => {
                                console.log(`Socket2 connected and authenticated.`);
                                let newgame = dummydata.newgame3;
                                newgame.creator = 'willyboomboom';

                                db.createGame(dummydata.newgame3).then((newgame3) => {
                                    this.newgameuuid = newgame3.uuid;
                                    done();
                                });
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
                db.deleteGame(this.newgameuuid).then(()=> {
                    done();
                });
            }).catch((e) => done(e));
        }).catch((e) => done(e));
    });
    beforeEach(function(done){

        this.socket.emit(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN,{username: 'willyboomboom',gameid: this.newgameuuid}, (result)=>{
            assert.equal(result.msg,EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_ACK );
            this.socket2.emit(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN,{username: 'willywonka',gameid: this.newgameuuid},(result2)=>{
                assert.equal(result2.msg,EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_ACK );
                done();

            });
        });
    });
    afterEach(function(done){
        this.socket.emit(EVENTS.LOBBY.CLIENT_LEAVE,{username:'willyboomboom',gameid:this.newgameuuid }, (result)=>{
            this.socket.emit(EVENTS.UTILS.CHECK_ROOM,null,(joinedrooms)=>{
                assert.equal(result,EVENTS.LOBBY.CLIENT_LEAVE_ACK);
                console.log(`current game : ${this.newgameuuid}`);
                console.log(`joined rooms : ${JSON.stringify(joinedrooms)}`);
                assert.equal(undefined,joinedrooms[this.newgameuuid]);
                assert.equal(Object.keys(joinedrooms).length,1); // only the main room now.
                this.socket2.emit(EVENTS.LOBBY.CLIENT_LEAVE,{username:'willywonka',gameid:this.newgameuuid }, (result)=>{
                    this.socket.emit(EVENTS.UTILS.CHECK_ROOM,null,(joinedrooms)=>{
                        assert.equal(result,EVENTS.LOBBY.CLIENT_LEAVE_ACK);
                        console.log(`current game : ${this.newgameuuid}`);
                        console.log(`joined rooms : ${JSON.stringify(joinedrooms)}`);
                        assert.equal(undefined,joinedrooms[this.newgameuuid]);
                        assert.equal(Object.keys(joinedrooms).length,1); // only the main room now.

                        this.socket.removeAllListeners(EVENTS.RECV_CHAT_MSG);
                        this.socket2.removeAllListeners(EVENTS.RECV_CHAT_MSG);
                        done();
                    })
                })
            })
        })

    })

    it('should be able to hear chat from inside lobby',function(done){
        let numrecv = 0;
        const onRecvMsg = (data)=>{
            assert.equal(data.sender_username  , 'willyboomboom');
            assert.equal(data.message , 'heyy wadup')
            logger.info('gameLobby.test',`received message. namespace: ${data.namespace}`);
            numrecv++;
            if (numrecv === 2)
                done();
        };

        this.socket.on(EVENTS.RECV_CHAT_MSG,onRecvMsg);
        this.socket2.on(EVENTS.RECV_CHAT_MSG,onRecvMsg);
        this.socket.emit(EVENTS.EMIT_CHAT_MSG,{
            message:'heyy wadup',
            namespace:this.newgameuuid,
            sender_username: 'willyboomboom'
        });

    })
    it('inside lobby chat shouldnt be heard from outside',function(done){
        //done(new Error("NOT IMPLM"))
        const onRecvMsg = (data)=>{
            done(new Error("OUTSIDE recv'ed inside message!"))
        }
        this.socket.emit(EVENTS.LOBBY.CLIENT_LEAVE,{username: 'willyboomboom',gameid:this.newgameuuid},(responseAck)=> {
            assert.equal(responseAck, EVENTS.LOBBY.CLIENT_LEAVE_ACK);
            this.socket.on(EVENTS.RECV_CHAT_MSG, onRecvMsg);

            this.socket2.emit(EVENTS.EMIT_CHAT_MSG, {
                message:'heyy wadup',
                namespace:this.newgameuuid,
                sender_username: 'willywonka'
            });
            setTimeout(()=>{
                done();
            },1800)
        });
    });


    it('main lobby chat shouldnt be heard from inside lobby',function(done){
        let numrecv = 0;
        const onRecvMsg = (data)=>{
            logger.error('gameLobby.test',`received message. namespace: ${data.namespace}`);
            done(new Error("RECEIVED OUTSIDE MSG IN LOBBY"));
        };
        this.socket.on(EVENTS.RECV_CHAT_MSG,onRecvMsg);
        this.socket2.on(EVENTS.RECV_CHAT_MSG,onRecvMsg);
        this.socket.emit(EVENTS.EMIT_CHAT_MSG,{
            message:'heyy wadup',
            namespace:null,
            sender_username: 'willyboomboom'
        });
        setTimeout(()=>done(),1900);

    })


    })
/*
- starting game
    - auth for gamestart - only creator can start game
    - everyone should receive start game event,  even on failure?
        - make stub for GMS contact. - doesnt have to be real. we're testing just  the
        end points.

 */