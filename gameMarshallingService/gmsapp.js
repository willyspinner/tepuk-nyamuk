require('dotenv').config({path: `${__dirname}/.gms.test.env`});
const redisdb = require('./db/redisdb');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const io = require('socket.io')();
const uuidvalidate = require('uuid-validate');
const crypto = require('crypto');
const events = require('./constants/socketEvents');
app.set('port', process.env.PORT || 3000);
const bodyParser = require('body-parser');
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
        });
    let cardsperplayer = 10; // this can be made a post body option (req.body) later if needed.
    let gamesessionid = crypto.createHmac('sha256', process.env.GAME_SECRET)
        .update(req.body.gameid, 'utf8').digest('hex');
    let gamesecret = crypto.createHmac('sha256',process.env.GAME_SECRET_2)
        .update(req.body.gameid,'utf8').digest('hex');
    // then we generate the game secret
    //  then we store the game secret in redis
    const salt = bcrypt.genSaltSync(10);
    const encryptedgamesecret = bcrypt.hashSync(gamesecret, salt);
    redisdb.initializeGame(gamesessionid, encryptedgamesecret,
        JSON.parse(req.body.players), cardsperplayer)
        .then((result) => {
            // then with the created game, we generate JWT gametoken.
            const gametoken = jwt.sign({gamesessionid: gamesessionid}, process.env.AUTH_TOKEN_SECRET, {expiresIn: 21600});
            
            console.log(`gmsapp: created new game: ${gamesessionid}`);
            res.status(200).json({
                success: true,
                gametoken: gametoken,
                gamesecret: gamesecret,
                gamesessionid: gamesessionid // this is to the appcs, so its ok.
            })
        }).catch(e => res.json({
        success: false,
        error: "redis failed to initialise gme."
    }));

});

// SOCKET AUTH

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
    gamesecret: awoinaodkawd129j12#
}

 */

io.use(function (socket, next) {
    if (socket.handshake.query.token) {
        jwt.verify(socket.handshake.query.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
            if (err){
                console.log(`gms::socketauth: socket authentication error: jwt token invalid for attempting to login as ${socket.handshake.query.username}`);
                return next(new Error('WS Auth Error'));
            }
            redisdb.getGameSecret(decoded.gamesessionid).then((encrpytedrealsecret) => {
                socket.username = socket.handshake.query.username;
                if (bcrypt.compareSync(socket.handshake.query.gamesecret, encrpytedrealsecret)) {
                    socket.gamesessionid = decoded.gamesessionid;
                   next(); // authorized.
                }
                else {
                    console.log(`socket authentication error: invalid gamesecret for ${socket.username} trying to go for ${socket.gamesessionid}`);
                    return next(new Error('WS Auth Error'));
                }
            }).catch(e =>{
                
                console.log(`socket authentication error: for ${socket.username}. redis db couldnt get secret.`);
                next(new Error("WS auth error: redisdb fail"))});
        })
    } else {
        
        console.log(`socket authentication error: no token provided by ${socket.username}`);
        next(new Error('WS Authentication Error'));
    }
}).on('connect', (socket) => {
    if(! socket.sentInit){
        socket.sentInit = true;
        // set connected to redis.
        
        console.log(`socket player connected for ${socket.username}`);
        socket.join(socket.gamesessionid);

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

        let gamesessionid = socket.gamesessionid;

        console.log(`gmsapp::events.PLAYER_THREW: socket ${socket.username} in room: ${JSON.stringify(gamesessionid)} `);
        redisdb.getUsername(gamesessionid, socket.id).then((un) => {
            // see if it is match event.
            username = un; // hmget returns an array, because we hmget can be used to get values for several keys.
            if (username == undefined){
                let responseobj = {success: false, error: `autherror: no such username or roomname: ${username}`};
                response(responseobj);
            }

            // find out if it already is a match event.
            /*the order is :currentTurn first, then getMatch. if we do it the other way
                around (getMatch -> currentTurn), then for every player (except one),
                we have to do these two redis calls.

               So currentTurn->getMatch will make us have one less redis call
               (since currentTurn will invalidate all but one player - the playerinturn).
            */

            console.log(`gmsapp::events.PLAYER_THREW: getting current turn for game sesh id: ${gamesessionid}`);
            redisdb.getCurrentTurn(gamesessionid).then((turn) => {
                console.log(`turn object: ${JSON.stringify(turn)}`);
                let playerinturn = turn.playerinturn;
                console.log(`gmsapp::events.PLAYER_THREW: ${username} THREW. ${playerinturn} was supposed to throw.`);
                if (playerinturn === username) {
                    // see if it is a match
                    redisdb.getMatch(gamesessionid).then((ismatch) => {
                        console.log(`gmsapp::events.PLAYER_THREW. is match? ${ismatch}`);
                        if (ismatch === 1)
                            response({
                                success: false,
                                error: "is currently in match"
                            });
                        else{
                            redisdb.popHandToPile(gamesessionid, username).then((poppedcard) => {
                                // increment counter.
                                redisdb.incrementCurrentCounter(gamesessionid).then((nextcounter) => {
                                    // check match event.
                                    
                                    console.log(`gmsapp::events.PLAYER_THREW. checking match : counter ${nextcounter.nextcounter % 13} ===  poppedcard ${poppedcard}?`);
                                    if (JSON.stringify(nextcounter.nextcounter % 13) === poppedcard) {
                                        // match event
                                        redisdb.setMatch(gamesessionid, true).then(() => {
                                            // go on with next tick as normal, waiting for people
                                            // to find out that it is a match and slap.
                                            io.to(gamesessionid).emit(events.NEXT_TICK, {
                                                match: true,
                                                piletop: poppedcard, // next top of pile.
                                                nextplayer: nextcounter.nextplayer,
                                                counter: nextcounter.nextcounter,
                                                playerthrew : username
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
                                            counter: nextcounter.nextcounter
                                            playerthrew : username
                                        });
                                        response({
                                            success: true
                                        })
                                    }
                                })
                            })
                        }
                        //throw card if not in match
                    })
                } else {
                    // not player's turn to throw.
                    response({
                        success: false,
                        error: "not your turn!"
                    })
                }
            }).catch((e)=>{

                console.log(`FAIL TO GET CURENT TURN`);
                response({
                    success:false,
                    error:"FAIL TO GET CURRENT TURN"
                })
            })
        })
    });
    // data is an object of the following:
    // {reactiontime: 0.2412 /*seconds */}
    socket.on(events.PLAYER_SLAPPED, (data, response) => {
        let username;
        let gamesessionid = socket.gamesessionid;
        redisdb.getUsername(gamesessionid, socket.id).then((un) => {
            if (un == undefined){
                response({success: false, error: "autherror: no such username or roomname"});
            }
            username = un;
            // ok. now see if match event.
            redisdb.getMatch(gamesessionid).then((ismatch) => {
                console.log(`gmsapp:events: registered PLAYER_SLAPPED: FOR ${username} ${gamesessionid}, `);
                
                console.log(`is match? ${ismatch}, type: ${typeof ismatch}`);
                if (ismatch === 1) {
                    // register slap.
                    redisdb.hasSlapped(gamesessionid,username).then((hasSlapped)=>{
                        if(hasSlapped === 1){
                            response({
                                success:false,
                                error: "you have already slapped."
                            });
                        }
                        else{
                            if(!data.reactiontime){
                                response({
                                    success:false,
                                    error:"no reaction time"
                                })
                            }
                            redisdb.slap(gamesessionid, username, data.reactiontime).then((slappedplayers) => {
                                io.to(gamesessionid).emit(events.PLAYER_SLAP_REGISTERED,{username: username});
                                
                                console.log(`gmsapp::events: PLAYER_SLAPPED for ${username} registered.`);
                                redisdb.getNplayers(gamesessionid).then((nplayers) => {
                                     nplayers = parseInt(nplayers);
                                    console.log(`gmsapp::events: n of ppl slapped: ${slappedplayers.length}, out of ${nplayers}`);
                                    if (slappedplayers.length === nplayers) {
                                        const loser = slappedplayers[slappedplayers.length - 1];
                                        Promise.all([
                                            redisdb.popAllPileToLoser(gamesessionid,loser),
                                                redisdb.resetSlaps(gamesessionid),
                                                redisdb.setCurrentCounter(gamesessionid, loser)
                                        ]).then((data)=>{
                                            let poppedpile = data[0];
                                            console.log(`popped pile given to ${username}: ${JSON.stringify(poppedpile)}`);
                                            io.to(gamesessionid).emit(events.MATCH_RESULT, {
                                                loser: loser,
                                                loserAddToPile: poppedpile.length,
                                                nextplayer:loser,
                                                matchResult: slappedplayers
                                            });
                                            response({success:true});
                                        }).catch((e)=>{
                                            response({success:false, error:`${e.stack}`});
                                        });
                                    }else {
                                        response({success:true});
                                    }
                                }).catch( (e)=>{

                                    console.log(`gmsapp::events.PLAYER_SLAPPED: failure: get nplayersfailed.`);
                                    response({success:false,error:"get nplayersfailed"})
                                });
                            }).catch((e)=>response({success:false,error:"slap failed"}))
                        }
                    })
                } else {
                    // punish accidental slap.
                    const loser = username;
                    
                    console.log(`gmsapp::events.PLAYER_SLAPPED: executing punishment promise`);
                    Promise.all([
                        redisdb.popAllPileToLoser(gamesessionid,loser),
                        redisdb.resetSlaps(gamesessionid),
                        redisdb.setCurrentCounter(gamesessionid,loser)
                    ]).then((data)=>{
                        const poppedpile = data[0];
                        console.log(`gmsapp::events.PLAYER_SLAPPED: poppedpile : ${JSON.stringify(poppedpile)}`);
                        io.to(gamesessionid).emit(events.MATCH_RESULT, {
                            loser: loser,
                            loserAddToPile: poppedpile.length,
                            nextplayer: loser
                        });
                        response({
                            success:true,
                            consequence: "you slapped when not in match!"
                        })
                    }).catch((e)=>{

                        console.error(`gmsapp::events.PLAYER_SLAPPED: pop pile to loser, reset slaps set current counter failed promise`);
                        console.error(e.stack);
                        response({
                            success:false,
                            error: " pop pile to loser, reset slaps, set current counter failed promise."
                        })
                    })
                }
            })
        });
    });

});