require('dotenv').config({path: `${__dirname}/.gms.test.env`});
const redisdb = require('./db/redisdb');
const express= require('express');
const reload = require('reload');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const io = require('socket.io')();
const uuidvalidate = require('uuid-validate');


app.set('port', process.env.PORT || 3000);
const bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
const server = app.listen(app.get('port'));

console.log(`GMS listening on ${app.get('port')}`);
io.attach(server);


// we use our middleware to deal with JWT auth
// this is to verify that the user attempting to log in for some socket route
// is indeed the one we created for them.
/*
The player is trying to authenticate themselves as a valid player who has joined
the game lobby, and is now transferring to the actual game room itself.

A truthful and real player would have a gamesecret sent to them (when they were at
the lobby and it was about to start) a token, and the gamesessionid. (gamesessionid)

sending details:
socket.handshake.query:
 {
     token: "JWT TOKEN", encodes: {gamesessionid}
     roomsecret: awoinaodkawd // NOTE. should this be in token or not? idts?
}

 */

app.post('/gms/game/create',(req,res)=>{

});
io.use(function (socket, next) {
    if (socket.handshake.query.token) {
        jwt.verify(socket.handshake.query.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
            if (err)
                return next(new Error('WS Auth Error'));
            redisdb.getGameSecret(decoded.gamesessionid).then((realsecret)=>{
                    if (socket.handshake.query.roomsecret === realsecret)
                        next();
                    else
                        return next(new Error('WS Auth Error')); // TODO: what's with the returns?
            }).catch(e=>next(new Error("WS auth error: redisdb fail")));
        })
    } else {
        next(new Error('WS Authentication Error'));
    }
}).on('connect', (socket) => {

});