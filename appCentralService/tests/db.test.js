// TESTS for our DB functions

require('dotenv').config({path: `${__dirname}/../.appcs.test.env`});
const db = require('../db/db');
const dummy = require ('./dummydata/dummydata');
const assert = require('assert');
// appcs environment var.

// NOTE: call db.initTables as needed to initialise the table.
// initialises db before every test.
describe('initialise table',function(){
    it('should initialise tables correctly',function(){
        db.initTables().then(()=>{
        done();
        }).catch((e)=>{
            console.log(`COULD NOT INITIALISE TABLE.`);
            done(e);
        })
    })
})
describe('create game', function(){
    afterEach(function(done){
        db.deleteGame(this.createdgameid).then((res)=>{
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
            db.queryOpenGames().then(games => {
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
    });
});
describe('delete game', function() {
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
describe('join game', function() {
    beforeEach(function (done) {
        //TODO: create a new game here.
    })
});
describe('leave game', function() {
    beforeEach(function (done) {
        //TODO: create a new game here.
    })
});

describe('startGame',function(){
    beforeEach(function(done){
        //TODO: create startgame here, with stubs to call our GMS.
    })


})