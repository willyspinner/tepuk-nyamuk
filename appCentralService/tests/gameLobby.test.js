//TESTS for our Gamelobby Http endpoints.
// make sure that appCS is online before running these tests!
require('dotenv').config({path: `${__dirname}/../.appcs.test.env`});
const dummydata = require('./dummydata/dummydata');
const request = require('request');
const assert = require('assert');
const ioclient = require('socket.io-client');
 //NOTE: due to heavy DB testing we don't really need to test
// our http endpoints..
// theyre fine.
// we do need to test our WS stuff initiated by the HTTP endpoints tho.
describe('LOGIN AND REGISTER routes',function(done){
    beforeEach(function(done){
        this.socket=null;
    })
    afterEach(function(done){
        this.socket.close();
    })
    after(function(done){

    })
    it('after register, username and socket should be established and WS should ' +
        'connect and receive updates on created and deleted games',function(done){
        request.post({
            url: `http://localhost:${process.env.PORT}/appcs/user/new`,
            body: {
                username: 'willyboomboom',
                password: 'berdoge'
            },
        },
        (err,res,body)=>{
            let token = body.token;
                this.socket = ioclient.connect(`http://localhost:${process.env.PORT}/main`,{
                    token: token,
                });
                thi
        });
    })
    it('after login,  WS should connect and receive updates on created games and ' +
        'deleted games',function(done){

    });

})