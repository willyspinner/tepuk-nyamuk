require('dotenv').config({path: `${__dirname}/.gms.test.env`});
const redisdb = require('./db/redisdb');
const express = require('express');
const reload = require('reload');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const io = require('socket.io')();
const uuidvalidate = require('uuid-validate');
const crypto = require('crypto');
const events = require('./constants/socketEvents');
app.set('port', process.env.PORT || 3000);
const bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
const server = app.listen(app.get('port'));

console.log(`GMS listening on ${app.get('port')}`);
io.attach(server);


/*
POST /gms/game/create: posted to GMS from appcs to create game

post body:
- gamename
- gameid
- players: an array of player usernames (stringified)

returns the following as json response (To appcs):
{
    gametoken: "103rh0hfawd" JWT token to be passed to game players to verify themselves
    // the token contains the GMS's gamesessionid.
    gamesecret: "109rh2pqiwnaklwdmaw" // secret used to join room
}
 */
app.post('/gms/game/create', (req, res) => {
    if (!uuidvalidate(req.body.gameid))
        res.json({
            success: false,
            error: "gameid invalid"
        });
    // first we generate the game session.
    if (JSON.parse(req.body.players).length < 2)
        res.json({
            success: false,
            error: "too few players."
        })
    let cardsperplayer = 10; // this can be made a post body option (req.body) later if needed.
    let gamesessionid = crypto.createCipher('aes-128-cbc', process.env.GAME_SECRET)
        .update(req.body.gameid, 'utf8', 'hex');
    gamesessionid = gamesessionid + gamesessionid.update.final('hex');
    // then we generate the game secret
    const gamesecret = crypto.createCipher('aes-128-cbc', process.env.GAME_SECRET)
        .update(gamesessionid, 'utf8', 'hex');
    const gamesecretfinal = gamesecret + gamesecret.update.final('hex');
    //  then we store the game secret in redis
    const salt = bcrypt.genSaltSync(10);
    const encryptedgamesecret = bcrypt.hashSync(gamesecretfinal, salt);
    redisdb.initializeGame(gamesessionid, encryptedgamesecret,
        JSON.parse(req.body.players), cardsperplayer)
        .then((result) => {
            // then with the created game, we generate JWT gametoken.
            const gametoken = jwt.sign({gamesessionid: gamesessionid}, process.env.AUTH_TOKEN_SECRET, {expiresIn: 21600});
            res.status(200).json({
                sucess: true,
                gametoken: gametoken,
                gamesecret: gamesecretfinal
            })
        }).catch(e => res.json({
        success: false,
        error: "redis failed to initialise game."
    }));

});


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
       token: "JWT TOKEN", encodes {gamesessionid:"some id sent"}
       //DANGER DANGER
      username: ____,
      //TODO NOTE: what's a better way to securely send a username?
      // this is open to false username attacks.
    roomsecret: awoinaodkawd129j12#
}

 */
io.use(function (socket, next) {
    if (socket.handshake.query.token) {
        jwt.verify(socket.handshake.query.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
            if (err)
                return next(new Error('WS Auth Error'));
            redisdb.getGameSecret(decoded.gamesessionid).then((encrpytedrealsecret) => {
                if (bcrypt.compareSync(socket.handshake.query.roomsecret, encrpytedrealsecret)){
                    socket.gamesessionid = gamesessionid;
                    socket.username = req.body.username;
                   next(); // authorized.
                }
                else
                    return next(new Error('WS Auth Error'));
            }).catch(e => next(new Error("WS auth error: redisdb fail")));
        })
    } else {
        next(new Error('WS Authentication Error'));
    }
}).on('connect', (socket) => {
    if(! socket.sentInit){
        socket.sentInit = true;
        // set connected to redis.
        redisdb.setPlayerConnected(socket.gamesessionid,socket.id,socket.username).then(()=>{
            Promise.all([
                //TODO chain this in redis! too inefficient.
                redisdb.getNplayers(socket.gamesessionid),
                redisdb.getConnectedPlayers(socket.gamesessionid)
            ]).then((data)=>{
                const totalplayers = data[0];
                const connectedplayers = data[1];
                if(totalplayers === connectedplayers) {
                    io.to(socket.gamesessionid).emit(events.GAME_START);
                }
            })
        });

    }
        //WARNING: no data from PLAYER_THREW?
    //What about to check if player is in sync?
    //remember that we have to authenticate the socket by looking up the id's username here.
    socket.on(events.PLAYER_THREW, (data, response) => {
        let username;
        let gamesessionid = socket.rooms[1]; // i think this is the right way.
        redisdb.getUsername(gamesessionid, socket.id).then((un) => {
            // see if it is match event.
            username = un; // hmget returns an array, because we hmget can be used to get values for several keys.
            if (username === undefined)
                response({success: false, error: "autherror: no such username or roomname"});
            // find out if it already is a match event.
            /*the order is :currentTurn first, then getMatch. if we do it the other way
                around (getMatch -> currentTurn), then for every player (except one),
                we have to do these two redis calls.

               So currentTurn->getMatch will make us have one less redis call
               (since currentTurn will invalidate all but one player - the playerinturn).
            */
            redisdb.getCurrentTurn(gamesessionid).then((playerinturn) => {
                if (playerinturn === username) {
                    // see if it is a match
                    redisdb.getMatch(gamesessionid).then((ismatch) => {
                        if (ismatch === 1)
                            response({
                                success: false,
                                error: "is currently in match"
                            });
                        //throw card if not in match
                        redisdb.popHandToPile(gamesessionid, username).then((poppedcard) => {
                            // increment counter.
                            redisdb.incrementCurrentCounter(gamesessionid).then((nextcounter) => {
                                // check match event.
                                if (JSON.stringify(nextcounter.newcounter % 13) === poppedcard) {
                                    // match event
                                    redisdb.setMatch(gamesessionid, true).then(() => {
                                        // go on with next tick as normal, waiting for people
                                        // to find out that it is a match and slap.
                                        io.to(gamesessionid).emit(events.NEXT_TICK, {
                                            match: true,
                                            piletop: poppedcard, // next top of pile.
                                            nextplayer: nextcounter.nextplayer,
                                            nextcounter: nextcounter.nextcounter
                                        });
                                        response({
                                            success: true,
                                        })
                                    });
                                } else {
                                    // just a normal throw.
                                    io.to(gamesessionid).emit(events.NEXT_TICK, {
                                        match: false,
                                        piletop: poppedcard, // next top of pile.
                                        nextplayer: nextcounter.nextplayer,
                                        nextcounter: nextcounter.nextcounter
                                    });
                                    response({
                                        success: true
                                    })
                                }
                            })
                        })
                    })
                } else {
                    // not player's turn to throw.
                    response.json({
                        success: false,
                        error: "not your turn!"
                    })
                }
            })
        })
    });
    // data is an object of the following:
    // {reactiontime: 0.2412 /*seconds */}
    socket.on(events.PLAYER_SLAPPED, (data, response) => {
        let username;
        let gamesessionid = socket.rooms[1];
        redisdb.getUsername(gamesessionid, socket.id).then((un) => {
            if (un == undefined)
                response({success: false, error: "autherror: no such username or roomname"});
            username = un;
            // ok. now see if match event.
            redisdb.getMatch(gamesessionid).then((ismatch) => {
                if (ismatch === 1) {
                    redisdb.hasSlapped(gamesessionid,username).then((hasSlapped)=>{
                        if(hasSlapped === 1)
                            response({
                                success:false,
                                error: "you have already slapped."
                            });
                        else{
                            redisdb.slap(gamesessionid, username, data.reactiontime).then((slappedplayers) => {
                                io.to(gamesessionid).emit(events.PLAYER_SLAP_REGISTERED,{username: username});
                                redisdb.getNplayers(gamesessionid).then((nplayers) => {
                                    if (slappedplayers.length === nplayers) {
                                        const loser = slappedplayers.pop();
                                        Promise.all([
                                            redisdb.popAllPileToLoser(gamesessionid,loser),
                                                redisdb.resetSlaps(gamesesionid),
                                                redisdb.setCurrentCounter(gamesessionid, nextplayer)
                                        ]).then((data)=>{
                                            let poppedpile = data[0];
                                            io.to(gamesessionid).emit(events.MATCH_RESULT, {
                                                loser: loser,
                                                loserAddToPile: poppedpile.length,
                                                nextplayer:loser,
                                            });
                                        }).catch((e)=>{
                                            response({success:false, error:`${e.stack}`});
                                        });
                                    }else {
                                        response({success:true});
                                    }
                                }).catch((e)=>response({success:false,error:"get nplayersfailed"}));
                            }).catch((e)=>response({success:false,error:"slap failed"}))
                        }
                    })
                } else {
                    const loser = username;
                    Promise.all([
                        redisdb.popAllPileToLoser(gamesessionid,loser),
                        redisdb.resetSlaps(gamesessionid),
                        redisdb.setCurrentCounter(gamesessionid,loser)
                    ]).then((data)=>{
                        const poppedpile = data[0];
                        io.to(gamesessionid).emit(events.MATCH_RESULT, {
                            loser: loser,
                            loserAddToPile: poppedpile.length,
                            nextplayer: loser
                        });
                    }).catch((e)=>response({
                        success:false,
                        error: " pop pile to loser, reset slaps, set current counter failed promise."
                    }))
                }
            })
        });
    });

});