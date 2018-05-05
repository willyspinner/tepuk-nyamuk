// TESTS for our DB functions

require('dotenv').config({path: `${__dirname}/../.appcs.test.env`});
const db = require('../db/db');
const dummy = require ('./dummydata/dummydata');
const assert = require('assert');
// appcs environment var.


// initialises db before every test.
describe('create game', function(){
    beforeEach(function(done){
        db.initTables().then(()=>{
            db.truncateGames().then(()=>{
                done()}
                ).catch((e)=>{
                    console.log(`${e}`);
                    console.log('ERROR DROPPING TABLES');
                    done(e);
            });
        }).catch((e)=>{
            console.log("ERROR CREATING GAME.");
            console.log(`${e}`);
           done(e);
        })
    });

    it('should return the same game as passed in (with additional info e.g. id)', function(done){
       console.log(`entering this new game: ${JSON.stringify(dummy.newgame)}`);
        db.createGame(dummy.newgame).then((resultgame)=>{
            assert.equal(resultgame.name,dummy.newgame.name);
            assert.equal(resultgame.creator,dummy.newgame.creator);
            assert.equal(resultgame.createdat,dummy.newgame.createdat);
            assert.equal(!!resultgame.uuid,true ); // gameLobbyId should be non null now.
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
      //TODO: create a new game here
    });
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