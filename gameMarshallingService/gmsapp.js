/*
initialize our environment.
 */
const logger = require('./log/gms_logger');
if (process.argv.length < 3  && !process.env.TPKENV){
    logger.error(`ENVIRONMENT NOT SET.`,` please specify one of : 'development.{local,lan} or production.{local,host} in either the script argument or as an environment variable to continue`);
    process.exit(1);
}
let decision = process.argv.length >=3 ? process.argv[2]: process.env.TPKENV;
switch(decision){
    case 'development.local':
        require('dotenv').config({path: `${__dirname}/../shared/.development.local.env`});
        break;
    case 'development.lan':
        require('dotenv').config({path: `${__dirname}/../shared/.development.lan.env`});
        break;
    case 'production.local':
        require('dotenv').config({path: `${__dirname}/../shared/.production.local.env`});
        break;
    case 'production.host':
        require('dotenv').config({path: `${__dirname}/../shared/.production.host.env`});
        break;
    default :
        throw new Error("INVALID environment mode.");
}
// gms ting here is default.
logger.info(`gmssapp.js`,`starting gms in ${decision} mode.`);
require('dotenv').config({path: `${__dirname}/.gms.test.env`});
const redisdb = require('./db/redisdb');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const ioserver = require('socket.io');
const uuidvalidate = require('uuid-validate');
const crypto = require('crypto');
const events = require('./constants/socketEvents');
const request = require('request');
const basicAuth = require('basic-auth');
const scoringFunction= require('./constants/scoringFunction');
app.set('port', process.env.GMS_PORT || 4000);
const bodyParser = require('body-parser');
const redis = require('redis');
const bluebird = require('bluebird');

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
const server = app.listen(app.get('port'));
const io = ioserver(server,{
    path:'/gms-socketio'
});

// connect to redispubsub.
bluebird.promisifyAll(redis.RedisClient.prototype);
const redisconnectionobject = {
        host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
};
const redispubsubclient = redis.createClient(redisconnectionobject);
redispubsubclient.configAsync("set","notify-keyspace-events","Ex").then(()=>{
    logger.info(`gmsapp initial`,"set config Ex for notify keyspace events ok.");
}).catch((e)=>{
    logger.error("gmsapp",`redis pubsub connection error. ${JSON.stringify(e)}`);
    process.exit(1);
});


logger.info('app.js initialize',`GMS listening on ${app.get('port')}`);
const APPCS_HOST = process.env.APPCS_HOST || 'localhost';
const APPCS_PORT = process.env.APPCS_PORT || 3000;

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
let Datadog = undefined;
if( process.argv[2] === 'production.host'){
    const dd_options = {
        'response_code':true,
        'tags': ['app:gms']
    }
    app.use(require('connect-datadog')(dd_options));
    logger.info(`appcs init`, `connecting to datadog monitor...`);

    StatsD=  require('node-dogstatsd').StatsD;
    Datadog = new StatsD();
    /*
    Datadog.socket.on('error', function (exception) {
          logger.error(`Datadog Node`,"error event in socket.send(): " + exception);
    });
    */

}
app.get('/health',(req,res)=>{
    logger.info('app.js: GET /health','health check.');
    res.sendStatus(200);
})
const authMiddleware = (req,res,next)=>{
    const user = basicAuth(req);
    if(!user || !user.name || !user.pass){
        logger.warn('POST /gms/game/create', `no auth provided.`);
        res.status(401).json({
            success:false,
            error:"No authentication information provided."
        })
        return;
    }
    if(user.name === process.env.INTERNAL_SECRET_USER
        && user.pass === process.env.INTERNAL_SECRET_PW) {
        next();

    }else{
        logger.warn('POST /gms/game/create', `incorrect auth provided.`);
        res.status(401).json({
            success:false,
            error:"Incorrect authentication information."
        });
        return;
    }
};


app.post('/gms/game/create', authMiddleware,(req, res) => {

    //TODO: make sure that there are no duplicate games!
        if (!uuidvalidate(req.body.gameid)) {
            res.json({
                success: false,
                error: "gameid invalid"
            });
            return;
        }

        // first we generate the game session.

        logger.info("POST /gms/game/create", `got req.body: ${JSON.stringify(req.body)}`)
        if (req.body.players.length < 2) {
            res.json({
                success: false,
                error: "too few players."
            });
            return;
        }
        let cardsperplayer =parseInt(req.body.gameOptions.cardsperplayer)|| parseInt(process.env.GAMESETTING_CARDS_PER_PLAYER);
        let gamesessionid = crypto.createHmac('sha256', process.env.GAME_SECRET)
            .update(req.body.gameid, 'utf8').digest('hex');
        let gamesecret = crypto.createHmac('sha256', process.env.GAME_SECRET_2)
            .update(req.body.gameid, 'utf8').digest('hex');
        // then we generate the game secret
        //  then we store the game secret in redis
        const salt = bcrypt.genSaltSync(10);
        const encryptedgamesecret = bcrypt.hashSync(gamesecret, salt);
        let gameCountdown = req.body.gameOptions.timelimitsecs || 60 *5;
        redisdb.initializeGame(req.body.gameid, gamesessionid, encryptedgamesecret,
            req.body.players.map((p)=>p.username), cardsperplayer,gameCountdown) // NO NEED TO JSON.parse(). It's already parsed.
            .then((result) => {
                logger.info(`POST /gms/game/create`,`redisdb.initializeGame succeded. seting initial PM snapshot..`)
                redisdb.setPostMatchSnapshot(gamesessionid,cardsperplayer,req.body.players.map((p)=>p.username),undefined).then(()=>{
                    logger.info(`POST /gms/game/create`,`setting initial PM snapshot succeeded. Signing new gametoken..`)
                    const gametoken = jwt.sign({gamesessionid: gamesessionid}, process.env.AUTH_TOKEN_SECRET, {expiresIn: 21600});
                    logger.info(`POST /gms/game/create`,`gmsapp: created new game: ${gamesessionid}`);
                    if(Datadog)
                        Datadog.increment('gms.game_created');
                    res.status(200).json({
                        success: true,
                        gametoken: gametoken,
                        gamesecret: gamesecret,
                        gamesessionid: gamesessionid // this is to the appcs, so its ok.
                    })
                }).catch(e => res.status(500).json({
                success: false,
                error: "redis failed to initialise gme."
                }));
                // then with the created game, we generate JWT gametoken.
            }).catch(e => res.status(500).json({
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
/* onWinGame - called when a winning condition, or expiration of game, is detected.*/
const onWinGame = (gamesessionid,winner,scoresnapshot,callback)=>{
    const resultObj = {winner : winner,finalscores:scoresnapshot};
    Promise.all([
    redisdb.getTimeAndTtlInSecs(gamesessionid),
    redisdb.getGameId(gamesessionid)
        ])
        .then((obj)=>{
            let time_remaining = parseInt(obj[0][0]);
            const original_time = parseInt(obj[0][1]);
           time_remaining = time_remaining === -2 ? 0: time_remaining;
           const totalgametime = original_time - time_remaining;
            const gameid = obj[1];
        request.post(
            {
                url : `http://${APPCS_HOST}:${APPCS_PORT}/appcs/game/finish/${gameid}`,
                headers:{
                    Authorization: "Basic "+ new Buffer(`${process.env.INTERNAL_SECRET_USER}:${process.env.INTERNAL_SECRET_PW}`)
                        .toString('base64')
                },
                form :{
                    resultObj:resultObj,
                    totalgametime
                }
            },
            (err,resp,body)=>{
                if (err){
                    callback({success:false})
                }
                io.to(gamesessionid).emit(events.GAME_FINISHED,
                    resultObj
                )
                if(Datadog){
                    Datadog.increment('gms.emit.game_finished');
                }
                callback({success:true});
            }
        );

    })
}
io.use(function (socket, next) {
    if (socket.handshake.query.token) {
        jwt.verify(socket.handshake.query.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                logger.warn(`gms::socketauth middleware`,` socket authentication error: jwt token invalid for attempting to login as ${socket.handshake.query.username}`);
                next(new Error('WS Auth Error'));
                return;
            }
            redisdb.getPlayers(decoded.gamesessionid).then((players) => {
                if(!players.includes(socket.handshake.query.username)){
                    logger.warn(`socket io authentication middleware`, `socket authentication error: for ${socket.handshake.query.username}. . Player not in game.`);
                    next(new Error("WS auth error: player not present in game"));
                    return;
                }
                redisdb.getGameSecret(decoded.gamesessionid).then((encrpytedrealsecret) => {
                    socket.username = socket.handshake.query.username;
                    if (bcrypt.compareSync(socket.handshake.query.gamesecret, encrpytedrealsecret)) {
                        socket.gamesessionid = decoded.gamesessionid;
                        next(); // authorized.
                    }
                    else {
                        logger.warn(`socket authentication error:`,` invalid gamesecret for ${socket.handshake.query.username} trying to go for ${decoded.gamesessionid}`);
                        next(new Error('WS Auth Error'));
                    }
                }).catch(e => {
                    logger.warn(`socket io authentication middleware`, `socket authentication error: for ${socket.handshake.query.username}. redis db couldnt get secret.`);
                    next(new Error("WS auth error: redisdb fail"));
                });
            }).catch(e => {
                logger.warn(`socket io authentication middleware`, `socket authentication error: for ${socket.handshake.query.username}. . Redisdb getPlayers failed.`);
                next(new Error("WS auth error: redisdb getPlayers failed."));
            });
        });
    } else {
        
        logger.warn(`socket authentication error:`,` no token provided by ${socket.handshake.query.username}`);
        next(new Error('WS Authentication Error'));
    }
}).on('connect', (socket) => {
    if(! socket.sentInit){
        socket.sentInit = true;
        // set connected to redis.
        
        logger.info(`socket.on('connect'):`,`socket player connected. Username: ${socket.username}`);
        if (Datadog)
            Datadog.increment('gms.on.connect');
        socket.join(socket.gamesessionid);

        redisdb.setPlayerConnected(socket.gamesessionid,socket.id,socket.username).then(()=>{
            Promise.all([
                //TODO chain this in redis! too inefficient.
                redisdb.getNplayers(socket.gamesessionid),
                redisdb.getConnectedPlayers(socket.gamesessionid)
            ]).then((data)=>{
                const totalplayers = parseInt(data[0]);
                const connectedplayers = data[1];
                logger.info("Socket on 'connect",`total players : ${totalplayers}, typeof: ${typeof totalplayers} total connected players : ${connectedplayers.length}`)
                //NOTEDIFF: changed bottom to .length, since it is an array reply.
                if(totalplayers === connectedplayers.length) {
                    Promise.all([
                        redisdb.getCurrentTurn(socket.gamesessionid),
                        redisdb.getCardsPerPlayer(socket.gamesessionid),
                        redisdb.startGameCountdown(socket.gamesessionid),
                    ]).then((data)=>{
                        const gamestartObj = {
                            playerinturn:data[0].playerinturn,
                            counter: data[0].currentcounter,
                            players:connectedplayers,
                            nhand: data[1],
                            timelimitsecs:data[2]
                        }
                        logger.info("Socket on 'connect'", `game start emitting with ${JSON.stringify(gamestartObj)}`)
                        io.to(socket.gamesessionid).emit(events.GAME_START,
                            gamestartObj
                        );
                    })
                }
            })
        });

    }
    socket.on('disconnect',(data)=>{
            redisdb.isAlive(socket.gamesessionid).then((isalive)=>{
                if (isalive){
                    logger.info('socket.on DISCONNECT',`first socket to disconnect in game. Game ${socket.gamesessionid} will be destroyed.`);
                    Promise.all([
                        redisdb.getGameId(socket.gamesessionid),
                            redisdb.deleteGame(socket.gamesessionid)
                    ]).then((data)=>{
                        const gameid = data[0];
                            request.post(
                                {
                                    url : `http://${APPCS_HOST}:${APPCS_PORT}/appcs/game/interrupt/${gameid}`,
                                    headers:{
                                        Authorization: "Basic "+ new Buffer(`${process.env.INTERNAL_SECRET_USER}:${process.env.INTERNAL_SECRET_PW}`)
                                            .toString('base64')
                                    },
                                } ,(err,res,body)=>{
                                    io.to(socket.gamesessionid).emit(events.GAME_INTERRUPT);
                                })
                    })
                }

            })

    });
    // synchronize so that when client's frontend fails, they can synchronize and adjust to be right.
    socket.on(events.SYNCHRONIZE, (data,response)=>{
        logger.info("on SYNCHRONIZE", "trying to sync socket ",socket.id);
        if(Datadog){
            Datadog.increment('gms.on.player_synchronize');
        }
        redisdb.getUsername(socket.gamesessionid, socket.id).then((un) => {
            username = un;
            if (username == undefined){
                let responseobj = {success: false, error: `autherror: no such username or roomname: ${username}`};
                response(responseobj);
            }
            Promise.all([
                redisdb.getCurrentTurn(socket.gamesessionid),
                redisdb.getMatch(socket.gamesessionid),
                redisdb.getPile(socket.gamesessionid),
                redisdb.getSnapshotLlen(socket.gamesessionid)
            ]).then((data)=>{
                const turnobj = data[0];

                let response_obj = {
                    success:true,
                    playerinturn:turnobj.playerinturn,
                    currentcounter:parseInt(turnobj.currentcounter),
                    match:data[1] ===1,
                    pile: data[2],
                    snapshot:data[3]
                };
                logger.info('on SYNCHRONIZE',`resolving with : ${JSON.stringify(response_obj)}`);
                response(response_obj);
                }).catch((e)=>{
                    response({
                        success:false,
                        error:e
                    })
            })
            }).catch((e)=>{
                response({
                    success:false,
                    error:e
                })
        })
        })


        //WARNING: no data from PLAYER_THREW?
    //What about to check if player is in sync?
    //remember that we have to authenticate the socket by looking up the id's username here.
    socket.on(events.PLAYER_THREW, (data, response) => {
        if (Datadog)
            Datadog.increment('gms.on.player_threw');
        let username;

        let gamesessionid = socket.gamesessionid;

        redisdb.getUsername(gamesessionid, socket.id).then((un) => {
            // see if it is match event.
            username = un; // hmget returns an array, because we hmget can be used to get values for several keys.
            if (username == undefined){
                let responseobj = {success: false, error: `autherror: no such username or roomname: ${username}`};
                response(responseobj);
                return;
            }

            // find out if it already is a match event.
            /*the order is :currentTurn first, then getMatch. if we do it the other way
                around (getMatch -> currentTurn), then for every player (except one),
                we have to do these two redis calls.

               So currentTurn->getMatch will make us have one less redis call
               (since currentTurn will invalidate all but one player - the playerinturn).
            */

            redisdb.getCurrentTurn(gamesessionid).then((turn) => {
                let playerinturn = turn.playerinturn;
                logger.info(`gmsapp::events.PLAYER_THREW: `,`${username} THREW. ${playerinturn} was supposed to throw.`);
                if (playerinturn === username) {
                    // see if it is a match
                    redisdb.getMatch(gamesessionid).then((ismatch) => {
                        if (ismatch === 1){
                            response({
                                success: false,
                                error: "is currently in match"
                            });
                        }
                        else{
                            Promise.all([
                                redisdb.popHandToPile(gamesessionid, username),
                                    redisdb.incrementCurrentCounter(gamesessionid)
                            ]).then((data_pop_inc)=>{
                                const poppedcard = data_pop_inc[0];
                                const nextcounter= data_pop_inc[1];
                                // increment counter.
                                    // check match event.
                                    logger.info(`gmsapp::events.PLAYER_THREW`,` checking match : counter ${nextcounter.nextcounter % 13 === 0 ? 13: nextcounter.nextcounter % 13} ===  poppedcard ${poppedcard}?`);
                                    if ((nextcounter.nextcounter % 13 === 0? 13:nextcounter.nextcounter % 13 )=== parseInt(poppedcard)) {
                                        logger.info(`gmsapp::events.PLAYER_THREW`, `MATCH! `);
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
                                            });
                                        });
                                    } else {
                                        // just a normal throw.
                                        Promise.all(
                                            [
                                                redisdb.getTotalCards(gamesessionid),
                                                redisdb.llenPile(gamesessionid)
                                            ]
                                        ).then((results)=>{
                                            const nTotalCards = parseInt(results[0]);
                                            const nPile = parseInt(results[1]);
                                            if (nTotalCards === nPile){
                                                logger.info('on PLAYER_THREW',`reshuffle event for gamesessionid ${gamesessionid}.`);
                                                const cardsPerPlayer = 5;

                                                    redisdb.getPostMatchSnapshot(gamesessionid).then((ss)=>{
                                                        let snapshot = ss;
                                                        logger.info(`on PLAYER_THREW`,`got non_zero_players snapshot : ${JSON.stringify(snapshot)}`)
                                                        const non_zero_players = ss.map((playerobj)=>playerobj.username);
                                                        redisdb.reshuffleFromPile(gamesessionid,cardsPerPlayer, non_zero_players).then(()=>{
                                                            redisdb.getPile(gamesessionid).then((pile)=>{

                                                                /*
                                                                NOTE: we identified the error.
                                                                Here we are issuing a nextTick matah false based on the old one. but the pile is renewed. So it might be fked.
                                                                so the card that is thrown needs to be hp.
                                                                The pile must be renewed, but not the piletop. The piletop needs to be the same as before.
                                                                Thus, we use lpop instead of lpop when getting the cards

                                                                step by step:
                                                                STATE: player THREW the last card already, everyone is on 0.
                                                                reshuffle -  (pop 5 * nplayers cards from pilebottom, and reassign)

                                                                 */
                                                                snapshot = snapshot.map((playerobj)=>({username:playerobj.username,nInHand : cardsPerPlayer}));
                                                                io.to(gamesessionid).emit(events.NEXT_TICK, {
                                                                    match: false,
                                                                    //piletop: poppedcard, // next top of pile.
                                                                    //NOTEDIFF: pile top isn't used here. we use newpile.
                                                                    nextplayer: nextcounter.nextplayer,
                                                                    counter: nextcounter.nextcounter,
                                                                    playerthrew : username,
                                                                    reshuffle: snapshot,
                                                                    newpile: pile
                                                                        /*
                                                                        remember snapshot format is:
                                                                        [
                                                                            {username: ___, nInHand: ___},
                                                                            {username: ___, nInHand: ___},
                                                                            {username: ___, nInHand: ___},
                                                                        ]
                                                                         */
                                                                });
                                                                response({
                                                                    success: true
                                                                })
                                                        })
                                                    })
                                                })
                                            }else{
                                                io.to(gamesessionid).emit(events.NEXT_TICK, {
                                                    match: false,
                                                    piletop: poppedcard, // next top of pile.
                                                    nextplayer: nextcounter.nextplayer,
                                                    counter: nextcounter.nextcounter,
                                                    playerthrew : username
                                                });
                                                response({
                                                    success: true
                                                })
                                            }
                                        })
                                    }
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

                logger.error(`on events.PLAYER_THREw`,`FAIL TO GET CURENT TURN`);
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
       if(Datadog){
           Datadog.increment('gms.on.player_slapped');
       }
        let username;
        let gamesessionid = socket.gamesessionid;
        redisdb.getUsername(gamesessionid, socket.id).then((un) => {
            if (un == undefined){
                response({success: false, error: "autherror: no such username or roomname"});
            }
            username = un;
            // ok. now see if match event.
            redisdb.getMatch(gamesessionid).then((ismatch) => {
                logger.info(`gmsapp:events: on PLAYER_SLAPPED`,`registered PLAYER_SLAPPED: FOR ${username} ${gamesessionid}. ismatch : ${ismatch}`);
                
                if (ismatch === 1) {
                    // register slap.
                    redisdb.hasSlapped(gamesessionid,username).then((hasSlapped)=>{
                        if(hasSlapped === 1){
                            response({
                                success:false,
                                error: "you have already slapped."
                            });
                            return;
                        }
                        else{
                            if(!data.reactiontime){
                                response({
                                    success:false,
                                    error:"no reaction time"
                                })
                                return;
                            }
                            Promise.all([
                                redisdb.slap(gamesessionid, username, data.reactiontime),
                                    redisdb.getNplayers(gamesessionid),
                                redisdb.incrScore(gamesessionid,username,scoringFunction(true,data.reactiontime))
                            ]).then((dataz)=>{
                                let nplayers = parseInt(dataz[1]);
                                let slappedplayers = dataz[0];
                                io.to(gamesessionid).emit(events.PLAYER_SLAP_REGISTERED,{username: username,reactiontime:data.reactiontime});
                                logger.info('gms::events: PLAYER_SLAPPED:  data.reactiontime:',`${data.reactiontime} registered for ${username}`);
                                logger.info(`gmsapp::events:PLAYER_SLAPPED`,`n of ppl slapped: ${slappedplayers.length}, out of ${nplayers}`);
                                    if (slappedplayers.length === nplayers) {
                                        const loser = slappedplayers[slappedplayers.length - 1];
                                        Promise.all([
                                            redisdb.popAllPileToLoser(gamesessionid,loser),
                                            redisdb.resetSlaps(gamesessionid),
                                            redisdb.setCurrentCounter(gamesessionid, loser),
                                            redisdb.setMatch(gamesessionid, false), //NOTEDIFF: put setMAtch false here.
                                            redisdb.setZeroStreak(gamesessionid,loser) //NOTEDIFF: put zero streak here.
                                        ]).then((data_l)=>{
                                            let poppedpile = data_l[0];
                                            logger.info(`gms::events::PLAYER_SLAPPED`,`popped pile given to the loser ${username}: ${JSON.stringify(poppedpile)}`);
                                            redisdb.getSnapshot(gamesessionid)
                                            .then((snapshot)=>{
                                                redisdb.setPostMatchSnapshot(gamesessionid,undefined,undefined,snapshot).then(()=>{
                                                    logger.info(`gms::events::PLAYER_SLAPPED: `,`match results: SNAPSHOT GOT ${JSON.stringify(snapshot)}`);
                                                    //NOTE: zeroed players don't have their key. So they are absent from the snapshot.
                                                    const zeroed_players = slappedplayers.filter((playerusername)=>
                                                        playerusername !== loser && !snapshot.map((playerobj)=>playerobj.username).includes(playerusername));
                                                    /*Promise.all(
                                                        zeroed_players
                                                            .map((zeroed_player_username)=>redisdb.incrementStreak(gamesessionid,zeroed_player_username))
                                                        )*/
                                                    //NOTEDIFF: optimized redis access pattern.
                                                    redisdb.massIncrementStreak(gamesessionid,zeroed_players)
                                                        .then((zeroed_players_new_streaks)=>{
                                                            let winning_condition = false;
                                                            let winner = null
                                                            zeroed_players_new_streaks.forEach((score,idx)=>{
                                                                logger.info(`STREAK UPDATE`,`player ${zeroed_players[idx]} now has ${score} streak${score >1? 's':''}.`);
                                                                if (score === 3){
                                                                    logger.info(`WINNING CONDITION`,`streak 3 for player ${zeroed_players[idx]}`)
                                                                    winning_condition = true;
                                                                    winner = zeroed_players[idx];
                                                                }
                                                            });
                                                            redisdb.getLowToHighScoreSnapshot(gamesessionid).then((scoresnapshot)=>{
                                                                logger.info('gmsapp: match result',` emitting match result now, with scoresnapshot: ${scoresnapshot}`)
                                                                if(Datadog){
                                                                    Datadog.increment('gms.emit.match_result');
                                                                }
                                                                io.to(gamesessionid).emit(events.MATCH_RESULT, {
                                                                    loser: loser,
                                                                    loserAddToPile: poppedpile.length,
                                                                    nextplayer:loser,
                                                                    matchResult: slappedplayers,
                                                                    streakUpdate:
                                                                        [
                                                                            ...zeroed_players_new_streaks.map((score,idx)=>{
                                                                                return {username: zeroed_players[idx], streak: score}
                                                                            }),
                                                                            {username: loser, streak: 0} //NOTEDIFF: bugfix here. Our loser isn't a zero hand player anymore.
                                                                            // So if he/she had a streak, ppl need to know that he doesn't have one anymore.
                                                                        ],
                                                                    scoreUpdate:scoresnapshot,
                                                                    isAccidental: false
                                                                });
                                                                if(winning_condition){
                                                                    /* START */
                                                                    onWinGame(gamesessionid,winner,scoresnapshot,()=>{
                                                                        redisdb.deleteGame(gamesessionid).then(()=>{
                                                                            logger.info('wining_condition',`${gamesessionid} game deleted...`);
                                                                            response({success:true});
                                                                        });
                                                                    });
                                                                    /* END */
                                                                }else{
                                                                    response({success:true});
                                                                }
                                                            })
                                                        });
                                                })
                                                })
                                        }).catch((e)=>{
                                            response({success:false, error:`${e.stack}`});
                                        });
                                    }else {
                                        response({success:true});
                                    }
                            }).catch((e)=>response({success:false,error:"slap failed"}))
                        }
                    })
                } else {
                    // punish accidental slap.
                    const loser = username;
                    logger.info(`gmsapp::events.PLAYER_SLAPPED`,` executing punishment promise for ${loser}`);
                    Promise.all([
                        redisdb.popAllPileToLoser(gamesessionid,loser),
                        redisdb.resetSlaps(gamesessionid),
                        redisdb.setCurrentCounter(gamesessionid,loser),
                        redisdb.incrScore(gamesessionid,loser,scoringFunction(false,0))
                    ]).then((data)=>{
                        const poppedpile = data[0];
                        const loserscore = parseInt(data[3]);
                        logger.info(`gmsapp::events.PLAYER_SLAPPED:`,` poppedpile : ${JSON.stringify(poppedpile)}`);
                        redisdb.setZeroStreak(gamesessionid,loser).then(()=>{
                            if(Datadog){
                                Datadog.increment('gms.emit.match_result');
                            }
                            io.to(gamesessionid).emit(events.MATCH_RESULT, {
                                loser: loser,
                                loserAddToPile: poppedpile ? poppedpile.length: 0,
                                nextplayer: loser,
                                streakUpdate: [{username:loser, streak: 0 }],// nothing NOTEDIFF: nothing since no one's streaks are increased or decreased.
                                scoreUpdate: [{username: loser, score: loserscore}],
                                isAccidental:true
                            });
                            response({
                                success:true,
                                consequence: "you slapped when not in match!"
                            })
                        }).catch((e)=>{
                            response({success:false, error :"redisdb set zero streak error."})
                        })
                    }).catch((e)=>{

                        logger.error(`gmsapp::events.PLAYER_SLAPPED: `,`pop pile to loser, reset slaps set current counter failed promise`);
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
// subscription
const determinePlacesByHandAndStreaks =  (handSnapshot,streakSnapshot)=>{
    let finalSnapshot = [];
    streakSnapshot.forEach((streaked_player)=>{
        // streaked players have 'negative hands'. NOTE: they can either have 0 streaks or more.
        // streakSnapshot contains all streaks.
        let hand = handSnapshot.find((hand)=>hand.username === streaked_player.username);
        hand = hand? hand.nInHand : 0;
        finalSnapshot.push({username: streaked_player.username,nInHand: hand === 0 ?  -1 * parseInt(streaked_player.streak) : hand});
    });
    //lowest 'hand' wins.
    return finalSnapshot.sort((a,b)=>a.nInHand < b.nInHand? -1:1).map((obj)=>obj.username);

};
const onExpire = (gamesessionid)=>{
    return new Promise((resolve,reject)=>{
        logger.info("gmsapp::onExpire",`${gamesessionid} expiring...`);
        Promise.all([
            redisdb.getSnapshotLlen(gamesessionid),
            redisdb.getStreaksSnapshot(gamesessionid),
            redisdb.getLowToHighScoreSnapshot(gamesessionid)
        ]).then((data)=> {
            logger.info(`gmsapp::onExpire`,`first promise resolved.`);
            let handSnapshot = data[0];
            let streaksSnapshot = data[1];
            let scoreSnapshot = data[2];
            let ranks = determinePlacesByHandAndStreaks(handSnapshot,streaksSnapshot);
            /*
                rank[0] : 1st place,
                rank[1] : 2nd place,
                rank[2] : 3rd place,
             */
            let winner = ranks[0];
            logger.info(`gmsapp::onExpire`,`ok. Winner : ${winner}`);
            onWinGame(gamesessionid, winner, scoreSnapshot, (cb) => {
                if (cb.success) {
                    redisdb.deleteGame(gamesessionid).then(() => {
                        logger.info('expire: onWinGame.', `${gamesessionid} game deleted...`);
                        resolve();
                    });
                }else{
                    reject();
                }
            })
        }).catch((e)=>{
            console.error('error : ',e);
        })
    });
    };


redispubsubclient.psubscribeAsync("__keyevent@*__:expired").then(()=>{
    redispubsubclient.on("pmessage",(pat, chan, msg)=>{
        onExpire(msg.split('/')[0]);
    });
    logger.info("gmsapp::init" , `subscribing to EXPIRE events for games...`);
}).catch((e)=>{
    logger.error(`gmsapp::init`,`couldn't psubscribe to EXPIRE games.. error: ${JSON.stringify(e)}`);
    process.exit(1);
});
// trapping exit signals.
const shutDown = async (signal) => {
    logger.warn(`signal ${signal}`, `shutting down gracefully..`);
    /* TODO - drop any games */
    logger.warn(`signal ${signal}`,`dropping all games...`);
    let activeGamesessionids= await redisdb.getAllActiveGamesessionids();
    logger.warn(`signal ${signal}`, `games : ${JSON.stringify(activeGamesessionids)}`);
    Promise.all(
        activeGamesessionids.map((activeGamesessionid)=>{
            return onExpire(activeGamesessionid);
        })
    ).then(async ()=>{
        await server.close();
        logger.warn(`signal ${signal}`, `Exit OK. Bye... 👋`);
        process.exit(0);
    }).catch(async (e)=>{
        await server.close();
        logger.warn(`signal ${signal}`, `EXIT ERROR. Did not exit gracefully. ${JSON.stringify(e)}. Bye... 👋`);
        process.exit(1);

    })

}

process.on(`SIGTERM`,()=>shutDown('TERM'));
process.on(`SIGINT`,()=>shutDown('INT'));
process.on(`SIGQUIT`,()=>shutDown('QUIT'));
