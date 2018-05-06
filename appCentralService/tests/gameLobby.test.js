//TESTS for actual joining of game lobbies.
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
/*
tests:
- joining  lobby
- reaction to other people joining
     - should see change reflected.
*/
describe('Joining lobby.',function() {
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
                this.token = token;
                this.socket = ioclient(`http://localhost:${process.env.PORT}`, {
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
    })
})
/*
- leaving lobby
- reaction to other people leaving
     - should see change reflected.
*/


/*
- starting game
    - auth for gamestart - only creator can start game
    - everyone should receive start game event,  even on failure?
        - make stub for GMS contact. - doesnt have to be real. we're testing just  the
        end points.

 */