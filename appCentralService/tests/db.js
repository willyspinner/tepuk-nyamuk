// TESTS for our DB functions
const db = require('../db/db');
const dummy = require ('./dummydata/dummydata');
const assert = require('assert');
// initialises db before every test.

describe('create game', function(){
    beforeEach(function(done){
        db.dropTables().then(()=>done());
    });

    it('should return the SAME game', function(done){
        db.createGame(dummy.newgame).then((result)=>{
            assert.equal(result.name,dummy.newgame.name);
            assert.equal(result.createdAt,dummy.newgame.createdAt);
            done();
        });
    });
    it('should return the Same game when queried by its id',function(done){
       db.createGame(dummy.newgame).then((result)=>{
           db.getGame(result.gameId).then( (game)=>{
                assert.deepEqual(result,game);
               done();
           }).catch(e=>{
               done(false);
           })
       })
    });
    it('should return the SAME game when queried for open games.', function(done){
        db.createGame(dummy.newgame).then((result)=> {
            db.queryOpenGames().then(games => {
                games.forEach((game) => {
                    if (game.gameId === result.gameId) {
                        assert.equal(game.name, result.name);
                        assert.equal(game.createdAt, result.createdAt);
                        done();
                    }
                });
                done(false); // <- this means that the db didn't save, which is incorrect.
            })
        });
    });
});
describe('delete game', function() {
    beforeEach(function (done) {
        db.dropTables().then(() => done());
    });
    //TODO: test cases for delete.
});
