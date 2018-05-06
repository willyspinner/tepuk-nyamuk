require('dotenv').config({path: `${__dirname}/../.gms.test.env`});
const dummydata = require('./dummydata/dummydata');
const assert = require('assert');
const redisdb = require('../db/redisdb');
describe('Test init game',function(){
    it('should initialise our dummy game',function(done){
        redisdb.initializeGame(dummydata.game1.gamesessionid,
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
    })
