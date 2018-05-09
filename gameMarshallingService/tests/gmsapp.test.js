require('dotenv').config({path: `${__dirname}/../.gms.test.env`});
const dummydata = require('./dummydata/dummydata');
const request = require('request');
const assert = require('assert');
const ioclient = require('socket.io-client');
const redisdb = require('../db/redisdb');
const events = require('../constants/socketEvents');
/*
notes:

connecting ioclient:


this.socket = ioclient(`http://localhost:${process.env.PORT}`, {
    query: {
        token: token,
        roomsecret: "ROOMSECRET HERE"
    }
});
// then just register your events.
socket.on(... .


 */
describe('gmsapp.test: initial connection to game', function () {
    it('should only start when all sockets connect (receive game start event)', function () {
        // check for a 3 player game using 3 diff sockets.
    });
});

describe('gmsapp.test: registering throw', function () {
    it('should only register throws for player in turn, and should be in pile', function (done) {

    });
});

describe('gmsapp.test: match', function () {
    it('should only match if card == (counter % 13) + 1 ', function (done) {
      //note. we're going to have to edit (illegally) the pile so that they here. this is where redisdb comes into play.
        // this wont happen in real games.
    });
    it('should not register throws for match event', function (done) {

    });
});

describe('gmsapp.test: slaps', function () {
    it('should register and punish false alarm slaps', function (done) {
    });
    it('should register slaps during match, and last one to slap (loser) gets punished', function (done) {
        
    });
});