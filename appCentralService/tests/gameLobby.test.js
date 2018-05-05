//TESTS for our Gamelobby Http endpoints.
// make sure that appCS is online before running these tests!
const dummydata = require('./dummydata/dummydata');
const request = require('request');
const assert = require('assert');
const socketio_client = require('socket.io-client');
 //NOTE: due to heavy DB testing we don't really need to test
// our http endpoints..
// theyre fine.
describe('LOGIN AND REGISTER routes',function(done){
    beforeEach(function(done){
        this.socket = socketio_client('/main'); // NOTE: /main hardcoded?
    })
    afterEach(function(done){
        this.socket.close();
    })
    it('should connect and receive updates on created tables',function(done){
    });

    it('should connect and receive updates on deleted tables',function(done){

    })
})