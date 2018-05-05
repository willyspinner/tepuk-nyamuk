// TESTS for our DB functions

require('dotenv').config({path: `${__dirname}/../.appcs.test.env`});
const db = require('../db/db');
const dummy = require ('./dummydata/dummydata');
const assert = require('assert');
const dbconstants = require('../db/schema/dbconstants');
// appcs environment var.

// NOTE: call db.initTables as needed to initialise the table.
// initialises db before every test. 
let lengthBefore;
describe('initialise table',function(){
    after(function(done){
        db.queryAllGames().then((games)=>{
            lengthBefore = games.length;
            done();
        }).catch((e)=>done(e));
    });
    it('should initialise tables correctly',function(done){
        db.initTables().then(()=>{
            done();
        }).catch((e)=>{
            console.log(`COULD NOT INITIALISE TABLE.`);
            done(e);
        })
    })
})

describe('create game', function(){
    // to ensure proper garbage clearing.
    after(function(done){
        db.queryAllGames().then((games)=>{
            assert.equal(lengthBefore,games.length);
            done();
        }).catch((e)=>done(e));
    });
    beforeEach(function(done){
        db.queryOpenGames().then((games)=>{
            this.gameslength = games.length;
           done();
        }).catch((e)=>done(e));
    });

    afterEach(function(done){
        db.deleteGame(this.createdgameid).then((res)=>{
            if(this.createdgameid2 )
                db.deleteGame(this.createdgameid2).then((res)=>{
                    done();
                }).catch((e)=>done(e))
            else
                done();
        }).catch((e)=>done(e))
    });

    it('should return the same game as passed in (with additional info e.g. id)', function(done){
       console.log(`entering this new game: ${JSON.stringify(dummy.newgame)}`);
        db.createGame(dummy.newgame).then((resultgame)=>{
            assert.equal(resultgame.name,dummy.newgame.name);
            assert.equal(resultgame.creator,dummy.newgame.creator);
            assert.equal(resultgame.createdat,dummy.newgame.createdat);
            assert.equal(!!resultgame.uuid,true ); // gameLobbyId should be non null now.
            this.createdgameid = resultgame.uuid;
            done();
        }).catch((err)=>done(err));
    });


    it('should return the Same game when queried by its id',function(done){
       db.createGame(dummy.newgame2).then((newgame)=>{
           db.getGame(newgame.uuid).then((game)=>{
               this.createdgameid = game.uuid;
                assert.deepEqual(newgame, game);
               done();
           }).catch(e=>{
               done(e);
           })
       }).catch((e)=>{
           done(false);
       })
    });
    it('should return the SAME game when queried for open games.', function(done){
        db.createGame(dummy.newgame).then((result)=> {
            this.createdgameid = result.uuid;
            db.createGame(dummy.newgame3).then((result)=>{
                this.createdgameid2 = result.uuid;
                db.startGame(result.uuid).then((result)=>{
                    db.queryOpenGames().then(games => {
                        assert.equal(games.length,this.gameslength + 1); // only open games.
                        // the one we made above is suposed to be started already.
                        games.forEach((game) => {
                            if (game.gameId === result.gameId) {
                                assert.equal(dummy.newgame.creator.name, result.name);
                                assert.equal(dummy.newgame.creator, result.creator);
                                assert.equal(dummy.newgame.createdat, result.createdat);
                                done();
                            }
                        });
                        done(false); // <- this means that the db didn't save, which is incorrect.
                    }).catch((err)=>done(false));
                }).catch((err)=>done(false));
            }).catch((err)=>done(false));
        }).catch((err)=>done(false));
    });
});
describe('delete game', function() {
    // to ensure proper garbage clearing.
    after(function(done){
        db.queryAllGames().then((games)=>{
            assert.equal(lengthBefore,games.length);
            done();
        }).catch((e)=>done(e));
    });
    beforeEach(function (done) {
        this.createdgameid = undefined;
        db.createGame(dummy.gameToBeDeleted).then((createdGame)=>{
            this.createdgameid = createdGame.uuid;
            done();
        }).catch((e)=>done(e));
    });
    it('should delete the game we just created. ',function(done){
        db.deleteGame(this.createdgameid).then((res)=>{
            db.getGame(this.createdgameid).then((res2)=>{
                assert.equal(res2,undefined);
                db.queryOpenGames().then(games => {
                    games.forEach((game) => {
                        if (game.gameId === result.gameId) {
                            done(false);
                        }
                    });
                    done();
                }).catch((err)=>done(false));
            })
        }).catch((e)=>done(e))
    })
});


describe('user management',function(){
    beforeEach(function(done){
        db.deleteUser(dummy.user1.username).then((result)=>{
            done();
        }).catch((e)=>done(e));
    })

    it('should register a user, and we should be able to get from db - without serets' +
        ' exposed',function(done){
        db.registerUser(dummy.user1).then((result)=>{
            db.getUser(dummy.user1.username).then((user)=>{
                assert.equal(user.username,dummy.user1.username);
                assert.equal(user.password,undefined); // THIS IS IMPORTANT!
                done();
            }).catch((e)=>done(e));
        }).catch((e)=>done(e));
    });
    it('should delete a user, and should NOT be able to get from db',function(done){
        db.registerUser(dummy.user1.username).then((result)=>{
            db.deleteUser(dummy.user1.username).then((user)=>{
                db.getUser(dummy.user1).then((gottenuser)=>{
                    assert.equal(gottenuser,undefined);
                    done();
                }).catch((e)=>done(e));
            }).catch((e)=>done(e));
        }).catch((e)=>done(e));
    })
})

describe('joining/leaving game', function() {
    // NOTE: we are using dummy.user2
    beforeEach(function (done) {
        db.deleteGame(this.createdgameid).then((result)=>{
            db.createGame(dummy.newgame).then((createdGame)=>{
                this.createdgameid = createdGame.uuid;
                    db.registerUser(dummy.user2).then((result=>
                            done()
                    )).catch((e)=>done(e));
            }).catch((e)=>done(e));
        }).catch((e)=>done(e));
    })
    afterEach(function(done){
        db.deleteGame(this.createdgameid).then((result)=>{

            db.deleteUser(dummy.user2.username).then((result)=>{
            done();
            }).catch((e)=>done(e))
        }).catch((e)=>done(e))
    })

    it('user should join a game and this change reflected in user and game tables',function(done){
        db.joinGame(dummy.user2.username,this.createdgameid).then((result)=>{
            db.getUser(dummy.user2.username).then((user)=>{
                assert.equal(user.gameid,this.createdgameid);
                db.getGame(this.createdgameid).then((game)=>{
                    game.players.forEach((player)=>{
                       if (player.username ===  dummy.user2.username)
                           done();
                    });
                    done(false);
                })
            }).catch((e)=>done(e));
        }).catch((e)=>{
            console.log(`failed to join game. `);
            console.log(`${e.stack}`);
            done(e);
        })
    });

    it('user should leave a game and change reflected in user and game tables. ',function(done){
        db.joinGame(dummy.user2.username,this.createdgameid).then((result)=>{
            db.leaveGame(dummy.user2).then(()=>{
                db.getUser(dummy.user2.username).then((user)=>{
                    assert.notEqual(user.gameid,this.createdgameid);
                    assert.equal(user.gameid,null);
                    db.getGame(this.createdgameid).then((game)=>{
                        //TODO: show that in this game, the player's not in it.
                        game.players.forEach((player)=>{
                            if (player.username ===  dummy.user2.username)
                                done(false);
                        });
                        done();
                    })
                }).catch((e)=>done(e));
            }).catch((e)=>done(e));
        }).catch((e)=>done(e));
    })
});



describe('startGame',function(){
    beforeEach(function(done){
        db.createGame(dummy.newgame).then((game)=>{
            assert.equal(game.status,dbconstants.GAMES.STATUS.LOBBY);
            this.createdgameid = game.uuid;
            done();
        }).catch((e)=>done(e));
    });
    afterEach(function(done){
        db.deleteGame(this.createdgameid).then(()=>{
            done()
        }).catch(e=>done(e));
    })
    it('status label should be changed.',function(done){
        db.startGame(this.createdgameid).then(()=>{
            db.getGame(this.createdgameid).then((game)=>{
                assert.equal(game.status,dbconstants.GAMES.STATUS.INPROGRESS);
                done();
            }).catch((e)=>done(e));
        }).catch((e)=>done(e));
    });
});