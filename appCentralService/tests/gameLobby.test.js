//TESTS for our Gamelobby Http endpoints.
// make sure that appCS is online before running these tests!
require('dotenv').config({path: `${__dirname}/../.appcs.test.env`});
const dummydata = require('./dummydata/dummydata');
const request = require('request');
const assert = require('assert');
const ioclient = require('socket.io-client');
const db = require('../db/db');
const EVENTS = require('../constants/socketEvents');
 //NOTE: due to heavy DB testing we don't really need to test
// our http endpoints..
// theyre fine.
// we do need to test our WS stuff initiated by the HTTP endpoints tho.
describe('LOGIN AND REGISTER routes',function() {
    beforeEach(function () {
        
        console.log(`trying test...`);
        this.socket = null;

    })
    afterEach(function () {
        if(this.socket)
        this.socket.close();
    });
    after(function(done){
        db.deleteUser('willyboomboom').then(()=>done()).catch((e)=>done(e));
    })

    it('after register, username and socket should be established in' +
        ' server db.', function (done) {
       console.log(`berdoge`); 
        console.log(`posting to http://localhost:${process.env.PORT}/appcs/user/new`);
        request.post({
                url: `http://localhost:${process.env.PORT}/appcs/user/new`,
                form: {
                    username: 'willyboomboom',
                    password: 'berdoge'
                },
            },
            (err, res, body) => {
            if(err){
                console.log(`ERROR HERE`);
                done(err);}
                
                console.log(`posting successful`);
                console.log(`got body : ${JSON.stringify(body)}`);
                assert.equal(true,JSON.parse(body).success);
                let token = JSON.parse(body).token;
                console.log(`got token : ${token}`);
                
                this.socket = ioclient(`http://localhost:${process.env.PORT}/main`, {
                    token: 'blla token',
                });
                // Notice how we're not actually accessing the game creation http routes.
                // this is so that we can isolate testing (separate them into easily-debuggable
                // tests).
                setTimeout(() =>{ 
                done(new Error("time out reached"))}, 1500); //1500ms lmit for socket to establish
                // conn.
                this.socket.on('connect', () => {
                    console.log(`Socket connected and authenticated.`);
                    db.getUserSecrets('willyboomboom').then((user) => {
                        assert.equal(user.socketid, this.socket.id);
                        assert.equal(user.username, 'willyboomboom');
                        assert.equal(user.gameid, null);
                        done();
                    }).catch((e) => done(e));
                });


            });
    })
    it(' login with wrong pw should be invalidated', function (done) {
        request.post({
            url: `http://localhost:${process.env.PORT}/appcs/user/auth`,
            body: {
                username: 'willyboomboom',
                password: 'berdogez' // wrong pw here.
            },
        },(err,res,body)=>{
            if(err)
                done(err);
            assert(body.success,false);
            done();
        });
    });


});

describe('game creation and gamae deletion events should be received by ' +
    'users logged in ',function() {
    before(function (done) {
        request.post({
                url: `http://localhost:${process.env.PORT}/appcs/user/new`,
                body: {
                    username: 'willyboomboom',
                    password: 'berdoge'
                },
            },
            (err, res, body) => {
                if (err)
                    done(err);
                let token = body.token;
                this.socket = ioclient.connect(`http://localhost:${process.env.PORT}/main`, {
                    token: token,
                });
                done();
            }
        );
    });
    after(function(done){
        db.deleteUser('willyboomboom').then(()=>{
            done();
        }).catch((e)=>done(e));
    })
    it('should receive game create updates',function(done){
        this.socket.on(EVENTS.GAME_CREATED,(socket_sent_Game)=>{
            assert.equal(socket_sent_Game,this.createdgame);
            done();
        });
        this.socket.on(EVENTS.GAME_DELETED,(socket_sent_Game)=>{
            assert.equal(socket_sent_Game,this.creawtedgame);
            done();
        });
    })
});