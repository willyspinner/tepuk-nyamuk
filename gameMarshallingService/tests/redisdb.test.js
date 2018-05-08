require('dotenv').config({path: `${__dirname}/../.gms.test.env`});
const dummydata = require('./dummydata/dummydata');
const assert = require('assert');
const redisdb = require('../db/redisdb');

describe('redisdb.test: init and delete game',function(){
    it('should initialise our dummy game',function(done){
        redisdb.initializeGame(dummydata.game1.gamesessionid, 'SECRET',
            dummydata.game1.players,dummydata.game1.cardsperplayer)
            .then((snapshot)=>{ // remember that snapshot are kv pairs of user: [c1,c2,,..]
                // where c1 c2 are the cards.
                
                console.log(`mocha: got snapshot: ${JSON.stringify(snapshot)}`);
                   Object.keys(snapshot).forEach((player)=>{
                       const playerhand = snapshot[player];
                       assert.equal(playerhand.length,dummydata.game1.cardsperplayer);
                   });
                done();
            }).catch((e)=>{
                done(new Error('failed'));
            })
        });
    it('should delete our dummy game, verified by an empty SCAN',function(done){

        redisdb.deleteGame(dummydata.game1.gamesessionid).then((retcode)=>{
            // confirm that in redis scan, there is none.
            redisdb.utils.scanAsync(0,`${dummydata.game1.gamesessionid}/*`,(keys)=>{
                assert.equal(keys.length,0);
                
                console.log(`delete dummy game ok .`);
                done();
            })
        }).catch((e)=>done(e));
    });
});

describe('redisdb.test: test popHandToPile', function(){
    before(function(done){
        redisdb.initializeGame(dummydata.game1.gamesessionid,"SECRET",
            dummydata.game1.players,dummydata.game1.cardsperplayer)
            .then((snapshot)=>{ // remember that snapshot are kv pairs of user: [c1,c2,,..]
                // where c1 c2 are the cards.
                Object.keys(snapshot).forEach((player)=>{
                    const playerhand = snapshot[player];
                    assert.equal(playerhand.length,dummydata.game1.cardsperplayer);
                });
                done();
            }).catch((e)=>{
            done(new Error('failed'));
        })
    });
    it('should pop hand to pile correctly',function(done){
        redisdb.getSnapshot(dummydata.game1.gamesessionid).then((snapshot)=>{
            redisdb.popHandToPile(dummydata.game1.gamesessionid,
                dummydata.game1.players[0]
            ).then((poppedcard)=>{
                    const hand= snapshot.find((elem)=>
                        elem.username === dummydata.game1.players[0]
                    ).hand;
                    const expectedcard = hand[hand.length - 1];
                    assert.equal(expectedcard,poppedcard);
                    done();
            }).catch(e=>done(e));
        })
    })
});

describe('redisdb.test: increment current counter testing',function(){
    before(function(done) {
        redisdb.initializeGame(dummydata.game1.gamesessionid,"SECRET",
            dummydata.game1.players, dummydata.game1.cardsperplayer)
            .then((snapshot) => {
                done()
            }).catch((e) => done(e));
    });
    after(function(done){
        redisdb.deleteGame(dummydata.game1.gamesessionid).then(()=>{
            done();
        }).catch(e=>done(e));
    });
    it('should be in order before having to repeat.',function(done) {
        redisdb.getCurrentTurn(dummydata.game1.gamesessionid).then((playerinturn) => {
            assert.equal(playerinturn, dummydata.game1.players[0]);
            redisdb.incrementCurrentCounter(dummydata.game1.gamesessionid).then((next) => {
                assert.equal(next.nextplayer, dummydata.game1.players[1]);
                assert.equal(next.nextcounter, 1);
                redisdb.incrementCurrentCounter(dummydata.game1.gamesessionid).then((next2) => {
                    assert.equal(next2.nextplayer, dummydata.game1.players[2]);
                    assert.equal(next2.nextcounter, 2);
                    redisdb.incrementCurrentCounter(dummydata.game1.gamesessionid).then((next3) => {
                        assert.equal(next3.nextplayer, dummydata.game1.players[3]);
                        assert.equal(next3.nextcounter, 3);
                        redisdb.incrementCurrentCounter(dummydata.game1.gamesessionid).then((next4) => {
                            assert.equal(next4.nextplayer, dummydata.game1.players[4]);
                            assert.equal(next4.nextcounter, 4);
                            done();
                        }).catch((e) => done(e));
                    }).catch((e) => done(e));
                }).catch((e) => done(e));
            }).catch((e) => done(e));
        }).catch((e) => done(e));
    });
    it('should be in order modulo nplayers',function(done){
        redisdb.getCurrentTurn(dummydata.game1.gamesessionid).then((playerinturn) => {
            assert.equal(playerinturn, dummydata.game1.players[4]);
            redisdb.incrementCurrentCounter(dummydata.game1.gamesessionid).then((next) => {
                assert.equal(next.nextplayer, dummydata.game1.players[0]);
                redisdb.incrementCurrentCounter(dummydata.game1.gamesessionid).then((next2) => {
                    assert.equal(next2.nextplayer, dummydata.game1.players[1]);
                    redisdb.incrementCurrentCounter(dummydata.game1.gamesessionid).then((next3) => {
                        assert.equal(next3.nextplayer, dummydata.game1.players[2]);
                        redisdb.incrementCurrentCounter(dummydata.game1.gamesessionid).then((next4) => {
                            assert.equal(next4.nextplayer, dummydata.game1.players[3]);
                            redisdb.incrementCurrentCounter(dummydata.game1.gamesessionid).then((next5) => {
                                assert.equal(next5.nextplayer, dummydata.game1.players[4]);
                                redisdb.incrementCurrentCounter(dummydata.game1.gamesessionid).then((next6) => {
                                    assert.equal(next6.nextplayer, dummydata.game1.players[0]);
                                done();
                                }).catch((e) => done(e));
                            }).catch((e) => done(e));
                        }).catch((e) => done(e));
                    }).catch((e) => done(e));
                }).catch((e) => done(e));
            }).catch((e) => done(e));
        }).catch((e) => done(e));
    });
});

describe('redisdb.test: slaps',function(){
    beforeEach(function(done) {
        redisdb.initializeGame(dummydata.game1.gamesessionid,"SECRET",
            dummydata.game1.players, dummydata.game1.cardsperplayer)
            .then((snapshot) => {
                done()
            }).catch((e) => done(e));
    });
    afterEach(function(done){
        redisdb.deleteGame(dummydata.game1.gamesessionid).then(()=>{
            done();
        }).catch(e=>done(e));
    });
    it('should register the slap on return obj, and on redis', function (done) {
        redisdb.slap(dummydata.game1.gamesessionid,
            dummydata.game1.players[3],1.62).then((slappedplayers)=>{
                assert.equal(slappedplayers.length,1); // only one slapped.
                assert.equal(slappedplayers[0],dummydata.game1.players[3]);
                done();
        }).catch(e=>done(e));
    });
    it('should register multiple slaps and rank increasing reaction time' +
        ' (fastest first, slowest last)', function (done) {
        const sessid = dummydata.game1.gamesessionid;
        const players = dummydata.game1.players;
        // we just simulate (although unecessarily) the conditions for the slap.
        // some slap first, others slap later. Then we see what happens in the end.
        Promise.all([
            new Promise((resolve,reject)=>{
                setTimeout(()=>{
                    redisdb.slap(sessid,players[0],JSON.stringify(0.300)).then(()=>{
                        resolve();
                    }).catch(e=>reject(e));
                },300)
           }),
            new Promise((resolve,reject)=>{
                setTimeout(()=>{
                    redisdb.slap(sessid,players[1],JSON.stringify(0.200)).then(()=>{
                        resolve();
                    }).catch(e=>reject(e));
                },200)
            }),
            new Promise((resolve,reject)=>{
                setTimeout(()=>{
                    redisdb.slap(sessid,players[2],JSON.stringify(0.750)).then(()=>{
                        resolve();
                    }).catch(e=>reject(e));
                },750)
            }),
            new Promise((resolve,reject)=>{
                setTimeout(()=>{
                    redisdb.slap(sessid,players[3],JSON.stringify(0.749)).then(()=>{
                        resolve();
                    }).catch(e=>reject(e));
                },749)
            }),
            new Promise((resolve,reject)=>{
                setTimeout(()=>{
                    redisdb.slap(sessid,players[4],JSON.stringify(0.650)).then(()=>{
                        resolve();
                    }).catch(e=>reject(e));
                },650)
            })
        ]).then((slapObjects)=>{
            assert.equal(slapObjects.length,5);
            redisdb.getSlappedPlayers(sessid).then((slappedplayers)=>{
                // from slowest to fastest.
                
                console.log(`slapped playersobj : ${JSON.stringify(slappedplayers)}`);
                assert.equal(slappedplayers.pop().username,players[2]);
                assert.equal(slappedplayers.pop().username,players[3]);
                assert.equal(slappedplayers.pop().username,players[4]);
                assert.equal(slappedplayers.pop().username,players[0]);
                assert.equal(slappedplayers.pop().username,players[1]);
                done();
            }).catch(e=>done(e));
        }).catch(e=>done(e));
    });
});

describe('redisdb.test: incrementing streaks', function () {
    before(function(done) {

        redisdb.initializeGame(dummydata.game1.gamesessionid,"SECRET",
            dummydata.game1.players, dummydata.game1.cardsperplayer)
            .then((snapshot) => {
                this.player1 = dummydata.game1.players[3];
                this.sessid= dummydata.game1.gamesessionid;
                done()
            }).catch((e) => done(e));
    });
    after(function(done){
        redisdb.deleteGame(dummydata.game1.gamesessionid).then(()=>{
            done();
        }).catch(e=>done(e));
    });
    it('should increment a person\'s streak, and set to 0.', function (done) {
        redisdb.incrementStreak(this.sessid,this.player1).then((newstreak)=>{
            assert.equal(newstreak,1);
            redisdb.incrementStreak(this.sessid,this.player1).then((newstreak2)=>{
                assert.equal(newstreak2,2);
                redisdb.incrementStreak(this.sessid,this.player1).then((newstreak3)=>{
                    assert.equal(newstreak3,3);
                    redisdb.setZeroSreak(this.sessid,this.player1).then((newstreak4)=>{
                        assert.equal(newstreak4,0);
                        done();
                    }).catch(e=>done(e));
                }).catch(e=>done(e));
            }).catch(e=>done(e));
        }).catch(e=>done(e));
    });
});

