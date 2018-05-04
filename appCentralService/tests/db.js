// TESTS for our DB functions
const db = require('../db/db');
const assert = require('assert');
const newgame = {
    name: "my game",
    createdAt: 1023481023,
    creator:"creator_USERNAME",
};
// initialises db before every test.

describe('create game', function(){
    beforeEach(function(done){
        db.dropTables().then(()=>done());
    })

    it('should return the SAME game', function(done){
        db.createGame(newgame).then((result)=>{
            assert.equal(result.name,newgame.name);
            assert.equal(result.createdAt,newgame.createdAt);
            done();
        });
    });
    it('should return the SAME game when queried for open games.', function(done){
        db.createGame(newgame).then((result)=> {
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