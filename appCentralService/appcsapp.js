const logger = require('./log/appcs_logger');
if (process.argv.length < 3) {
    console.error("ERROR. Environment not set.");
    console.log(`please specify one of : 'development.{local,lan} or production.{local,host} to continue`);
    process.exit(1);
}
switch (process.argv[2]) {
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
require('dotenv').config({path: `${__dirname}/.appcs.test.env`})
logger.info(`connection details`, `connection details : appcs: ${process.env.APPCS_HOST}:${process.env.APPCS_PORT}, gms: ${process.env.GMS_HOST}:${process.env.GMS_PORT}.`)
logger.info(`connection details`, `pub sub redis : ${process.env.APPCS_REDIS_PUBSUB_HOST}:${process.env.APPCS_REDIS_PUBSUB_PORT}`);
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const moment = require('moment');
const app = express();
const ioserver = require('socket.io');
const db = require('./db/db');
const EVENTS = require('./constants/socketEvents');
const uuidvalidate = require('uuid-validate');
const request = require('request');
const basicAuth = require('basic-auth');
const socketioredis = require('socket.io-redis');
const cookieParser = require('cookie-parser');
const chatroomdb = require('./db/chatroomDb');
const notifdb = require('./db/notifDb');
const exp = require('./exp/func.exp');
// appcs environment var.

// constants

if (process.env.APPCS_PORT) {
    app.set('port', process.env.APPCS_PORT);
} else {
    app.set('port', process.env.APPCS_PORT || 3000);
}
if (process.argv.length > 3) {
    app.set('port', process.argv[3]);
}
// body parser
const bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(cookieParser());
if (process.argv[2] === 'production.host') {
    const dd_options = {
        'response_code': true,
        'tags': ['app:appcs']
    }
    app.use(require('connect-datadog')(dd_options));
    logger.info(`appcs init`, `connecting to datadog monitor...`);

}

// server listening.

const server = app.listen(app.get('port'));
logger.info(`app.js`,`API server listening on ${app.get('port')}`)
const io = ioserver(server, {
    path: '/appcs-socketio',
    pingTimeout: 15000, // ms
    pingInterval: 10000 // ms


})
io.adapter(socketioredis({host: process.env.APPCS_REDIS_PUBSUB_HOST, port: process.env.APPCS_REDIS_PUBSUB_PORT}));
//NOTE: do we attach it to the server? really?
logger.info('app.js', `ioserver listening on ${app.get('port')}`);

app.use(function (req, res, next) {
    //NOTEDIFF: Changed ALLOW ORIGIN to our thing only in production.
    //TODO: load these configs in runtime in consul.
    res.header("Access-Control-Allow-Origin", process.env.TEPKENV === 'production' ? process.env.DOMAINNAME : '*');
    //res.header("Access-Control-Allow-Origin",'*');
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, ")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //res.header('berdoge','ehehe');
    next();
});
/*
POST: /appcs/user/new.
register a new user

POST BODY:
username
password
 */
// there should be some client side validation on NON NULL name.
app.post('/appcs/user/new', (req, res) => {
    if (!req.body.username || !req.body.password) {
        res.status(400).json({
            success: false,
            error: 'invalid details'
        });
        return;
    }
    db.getUser(req.body.username).then((user) => {
        if (!user) {
            const salt = bcrypt.genSaltSync(10);
            const userObj = {
                username: req.body.username,
                password: bcrypt.hashSync(req.body.password, salt)
            };
            Promise.all([
                db.registerUser(userObj),
                chatroomdb.getMainchat()
            ]).then((data) => {
                const mainchat = data[1];
                const expiresIn = 7200;
                const token = jwt.sign({username: userObj.username},
                    process.env.AUTH_TOKEN_SECRET, {
                        expiresIn // secs, so 2 hours.
                    });

                res
                    .cookie('tpk_app_token', token, {expiresIn})
                    .status(201).json({
                    success: true,
                    token: token,
                    stringifiedmainchat: mainchat,
                    expObject: {
                        currentLevelIdx : 0,
                        currentExp : 0,
                        currentLevelObj: exp.getLevel(0),
                        nextLevelObj: exp.getLevel( 1),
                    }
                })
            }).catch((e) => {
                res.status(500).json({
                    success: false
                });
            })
        } else
        // a user is already defined with that name
            res.status(403).json({
                success: false,
                error: 'User already exists.'
            });
    });
});

/*

POST /appcs/user/auth
// Authenticates user (login)
POST BODY:
// username
// password

 */
app.post('/appcs/user/auth', (req, res) => {
    logger.info(`POST /appcs/user/auth.`, `Post body: ${JSON.stringify(req.body)}`);
    if (!req.body.username) {
        res.status(400).json({
            success: false,
            error: `invalid request.`
        });
        return;
    }
    db.getUserSecrets(req.body.username).then((user) => {
        if (!user) {
            res.status(403).json({
                success: false,
                error: ` no such user: ${req.body.username}.`
            });
            return;
        }
        const passwordValid = bcrypt.compareSync(req.body.password, user.password);
        if (passwordValid) {
            const expiresIn = 7200;
            let token = jwt.sign({username: user.username},
                process.env.AUTH_TOKEN_SECRET,
                {expiresIn});
            chatroomdb.getMainchat().then((mainchat) => {
                res
                    .cookie('tpk_app_token', token, {expiresIn})
                    .status(200).json({
                    success: true,
                    token: token,
                    stringifiedmainchat: mainchat,
                    expObject: {
                        currentLevelIdx : user.level,
                        currentExp : user.exp,
                        currentLevelObj: exp.getLevel(user.level),
                        nextLevelObj: exp.getLevel( user.level+ 1),
                    }
                });
            });
        } else {
            res.status(401).json({
                success: false,
                token: null
            })
        }
    }).catch((e) => {
        res.status(500).json({success: false});
    })

})


/* GET RANKINGS */
app.get('/appcs/user/rankings',(req,res)=>{
    db.getRankingByExp(5).then((topFive)=> {
        res.status(200).json({
            success: true,
            rankings: topFive /* they have exp, level and username */
        })
    });
    // auth jwt.
    logger.info('GET /appcs/user/rankings', `req.headers : ${JSON.stringify(req.headers)}`)
    /*
    if (!req.body.token ) {
        res.status(400).json({
            success: false,
            error: "Bad request."
        });
        return;
    }
    jwt.verify(req.body.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            res.status(401).json({
                success: false,
                error: 'NOT AUTHENTICATED.'
            });
            return;
        }else{
            db.getRankingByExp(5).then((topFive)=>{
                res.status(200).json({
                    success:true,
                    rankings: topFive
                })
            })
        }
    });
*/
});
/*

AppCS Route.
 GET /appcs/game : get all open games.
Shouldn't get the creator's socket id.

NOTE: FOR SAFETY, THE USERS MUST NOT HAVE THEIR SOCKET ID's
ATTACHED IN THE RESPONSE BODY OF THIS ROUTE:
TESTED . OK.
 */

app.get('/appcs/game', (req, res) => {
    logger.info(`GET /appcs/game`, `querying open games...`);
    db.queryOpenGames().then((games) => {
        logger.info(`GET /appcs/game`, `responding with games: ${JSON.stringify(games)}`);
        res.status(200).json({
            success: true,
            games
        });
    }).catch((e) => {
        res.status(500).json({
            success: false,
            error: JSON.stringify(e)
        })
    });
});

/*

AppCS Route.
 POST /appcs/game/create/ : Create game

POST body:

    game: game object
    token


 */
app.post('/appcs/game/create', (req, res) => {
    // the creator information is here already. (inside req.body.game object).
    if (!req.body.token || !req.body.game) {
        res.status(400).json({
            success: false,
            error: "Bad request."
        });
        return;
    }
    jwt.verify(req.body.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            res.status(401).json({
                success: false,
                error: 'NOT AUTHENTICATED.'
            });
            return;
        }
        let game = req.body.game; //NOTEDIFF: from frontend, game is already json.
        game.creator = decoded.username;
        if (!game.numberOfMaxPlayers)
            game.numberOfMaxPlayers = 8;
        logger.info('POST /appcs/game/create', `Creating game : ${JSON.stringify(game)}. Cookies: ${JSON.stringify(req.cookies)}`)
        db.createGame(game).then((newgame) => {
            // link used to go to the lobby page.
            io.emit(EVENTS.GAME_CREATED, {
                game: newgame
            });
            res.status(200).json({
                success: true,
                game: newgame
            })
        }).catch((e) => {
            res.status(500).json({
                success: false
            })
        });
    })
});


/*

AppCS Route.
DELETE /appcs/game/delete/:gameId: Delete game

POST body:

    socketid: "awdijaos2123eda",
    token

TESTED. OK.
 */
app.delete('/appcs/game/delete/:gameid', (req, res) => {
    if (!req.body.token || !req.body.socketid) {
        res.status(400).json({success: false});
        return;
    }
    if (!uuidvalidate(req.params.gameid)) {
        res.status(400).json({
            success: false,
            error: 'invalid game id.'
        });
        return;
    }
    jwt.verify(req.body.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            res.status(401).json({success: false, error: 'unauthorized.'});
            return;
        }

        logger.info(`AppCS::app.js::delete game route`, ` jwt signature verified`);
        console.log(`get game user id: ${req.params.gameid}`);
        db.getGame(req.params.gameid).then((game) => {
            if (!game) {
                res.status(404).json({
                    success: false,
                    error: "no such game."
                });
                return;
            }
            db.getUserSecrets(game.creator).then((creator) => {
                logger.info("DELETE /appcs/game/delete/:gameid", `trying to authenticate deleter...`);
                logger.info("DELETE /appcs/game/delete/:gameid", `creator.socketid : ${creator.socketid}`);
                logger.info("DELETE /appcs/game/delete/:gameid", `req.body.socketid : ${req.body.socketid}`);
                logger.info("DELETE /appcs/game/delete/:gameid", `creator.username: ${creator.username}`);
                logger.info("DELETE /appcs/game/delete/:gameid", `decoded.username : ${decoded.username}`);
                if (creator.socketid === req.body.socketid && creator.username === decoded.username) {
                    logger.info(`AppCS::app.js::delete game route`, ` credentials verified for deletion.`);
                    Promise.all([
                    db.deleteGame(req.params.gameid),
                        chatroomdb.deleteRoomchat(req.params.gameid)
                    ]).then(() => {
                        console.log(`AppCS::app.js::delete game route: emitting to main lobby...`);
                        io.emit(EVENTS.GAME_DELETED, {
                            gameuuid: req.params.gameid
                        });
                        io
                            .to(req.params.gameid)
                            .emit(EVENTS.LOBBY.LOBBY_GAME_DELETED);
                        res.status(200).json({
                            success: true,
                        })
                    }).catch((e) => {
                        res.status(500).json({
                            success: false,
                            error: "here1"
                        })
                    });
                } else {
                    res.status(401).json({
                        success: false,
                        error: "unauthorized."
                    });
                }
            }).catch((e) => {
                logger.error("DELETE /appcs/game/delete/:gameid", `${JSON.stringify(e)}`)
                res.status(500).json({
                    success: false,
                    error: "here2 berdog"
                })
            });
        }).catch((e) => {
            res.status(500).json({
                success: false,
                error: "here3"
            })
        });
    });
});


/*

AppCS Route.
POST /appcs/game/start/:gameId: Start game
NOTE: we communicate with our GMS here.
POST body:

    gameid:"awdnsoawd", // game id of one to be deleted.
    socketid:"ajwodmala" // socket id of requester
    token

 */

app.post('/appcs/game/start/:gameid', (req, res) => {
    if (!req.body.token || !req.body.socketid) {
        res.status(400).json({
            success: false,
            error: "invalid details."
        })
        return;
    }
    jwt.verify(req.body.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            res.status(401).json({
                success: false,
                error: 'Invalid token.'
            });
            return;
        }
        logger.info('POST /appcs/game/start/:gameid', `decoded jwt token: ${JSON.stringify(decoded)}`);
        db.getGame(req.params.gameid).then((game) => {
            if (!game) {
                res.status(404).json({
                    success: false,
                    error: "no such game."
                });
                return;
            }
            logger.info("POST /appcs/game/start/:gameid", `got game ${JSON.stringify(game)}`);
            db.getUserSecrets(game.creator).then((creator) => {
                logger.info("creator vs req socketids:", `${creator.socketid} vs ${req.body.socketid}`)
                logger.info("creator vs req usernames:", `${creator.username} vs ${decoded.username}`)
                if (creator.socketid === req.body.socketid && creator.username === decoded.username) {
                    //TODO: communicate with GMS.
                    //TODO send all the sockets the JWT to access our GMS game room.
                    //TODO TODO
                    const GMS_HOST = process.env.GMS_HOST || 'localhost';
                    const GMS_PORT = process.env.GMS_PORT || 4000;
                    request.post({
                            url: `http://${GMS_HOST}:${GMS_PORT}/gms/game/create`,
                            headers: {
                                Authorization: "Basic " + new Buffer(`${process.env.INTERNAL_SECRET_USER}:${process.env.INTERNAL_SECRET_PW}`)
                                    .toString('base64')
                            },
                            form: {
                                gameid: req.params.gameid,
                                gamename: "zz game", // NOTE:  we don't actually need the game name i think.
                                players: game.players,// an array of the usernames.
                                gameOptions: req.body.gameOptions
                            },
                        },
                        (err, resp, body) => {
                            if (err) {
                                res.status(500).json({
                                    success: false,
                                    error: "server request error."
                                })
                                return;
                            }
                            let response = null;
                            try {
                                response = JSON.parse(body);
                            } catch (e) {
                                res.status(500).json({
                                    success: false,
                                    error: "game server error."
                                })
                                return;
                            }

                            if (!response.success) {
                                res.status(400).json({
                                    success: false,
                                    error: "bad request",
                                    err2: `${JSON.stringify(response.error)}`
                                });
                                return;
                            }
                            //oops. forgot to add this chunk below:
                            db.startGame(req.params.gameid).then(() => {
                                // emit to main lobby that this game is starting..
                                io.emit(EVENTS.GAME_STARTED, {gameuuid: req.params.gameid});
                                io
                                    .to(req.params.gameid)
                                    .emit(EVENTS.LOBBY.GAME_START, {
                                        gametoken: response.gametoken,
                                        gamesecret: response.gamesecret,
                                        gamesessionid: response.gamesessionid
                                    });
                                res.status(200).json({
                                    success: true
                                });
                            })
                        });
                }
                else
                    res.status(401).json({
                        success: false,
                        error: 'unauthorized.'
                    });
            }).catch((e) => {
                res.status(500).json({
                    success: false,
                    error: 'server error 1',
                    e: JSON.stringify(e)
                })
            });
        }).catch((e) => {
            res.status(500).json({
                success: false,
                error: 'server error 2',
                e: JSON.stringify(e)
            })
        });
    })
});

/*

GMS to APPCS route. Finish game.
 */
const GMSAuthMiddleware = (req, res, next) => {
    const user = basicAuth(req);
    if (!user || !user.name || !user.pass) {
        logger.warn('GMS AUTH Middleware', `no auth provided.`);
        res.status(401).json({
            success: false,
            error: "No authentication information provided."
        })
        return;
    }
    if (user.name === process.env.INTERNAL_SECRET_USER
        && user.pass === process.env.INTERNAL_SECRET_PW) {
        next();
    } else {
        logger.warn('GMS AUTH Middleware', `incorrect auth provided.`);
        res.status(401).json({
            success: false,
            error: "Incorrect authentication information."
        });
    }
};
app.post(`/appcs/game/interrupt/:gameid`, GMSAuthMiddleware, (req, res) => {
    db.bulkLeaveGameAndDelete(req.params.gameid).then(() => {
        io.emit(EVENTS.GAME_DELETED,
            {
                gameuuid: req.params.gameid
            }
        );
        res.status(200).json({
            success: true
        });
    }).catch((e) => {
        res.status(500).json({
            success: false,
            error: e
        })
    })

});
app.post(`/appcs/game/finish/:gameid`, GMSAuthMiddleware, (req, res) => {
    //TODO: make expUpdateObj.
    Promise.all(
        [
        db.gmsFinishGame(req.params.gameid, req.body.resultObj),
        exp.bulkIncrementExpAndLevel(exp.calculateExpGains(req.body.resultObj,req.body.totalgametime))
    ]
    ).then((data) => {
        const expUpdates = data[1];
        /*
        {
                            username: player.username,
                            currentLevelIdx : level,
                            currentExp,
                            currentLevelObj: Scorer.getLevel(level),
                            nextLevelObj: Scorer.getLevel(level + 1)
            }
            */

        //emit to users: when they connect?  Put a redis thingy that waits for them?
        /*/notif/user/USERNAMEHERE: jstring.  */
        /* This expires as soon as we read it. */
        /*
        Final data:
        {
         */
        Promise.all(
            expUpdates.map((expUpdate) => notifdb.setNotif(expUpdate.username, JSON.stringify({type:'EXP',expObject: expUpdate}))))
        .then(() => {
            // emit to main lobby that the game is finished (deleted)
            io.emit(EVENTS.GAME_DELETED,
                {
                    gameuuid: req.params.gameid
                }
            );
            res.json({
                success: true,
            })
        })

    }).catch((e) => {
        logger.error(`ERROR TING `,JSON.stringify(e));
        res.status(500).json({
            success: false,
            error: "postgresql finish game error."
        })
    })

});

// health check
app.get('/health', (req, res) => {
    logger.info("app.js: GET /health", "health checkup...");
    res.sendStatus(200);
})

// WS routes: authenticated
// we use our middleware to deal with JWT auth
io.use(function (socket, next) {
    if (socket.handshake.query.token) {
        logger.info(`socket.io authentication middleware`, `verifying token ${socket.handshake.query.token}`);
        jwt.verify(socket.handshake.query.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
            if (err)
                return next(new Error('WS Auth Error'));
            logger.info(`socket.io authentication middleware`, `verified token for user: ${decoded.username} `);
            socket.username = decoded.username;
            socket.token = socket.handshake.query.token;//TODO: is this needed?
            db.loginUserSocketId(socket.username, socket.id).then(() => {
                socket.sentMydata = false;
                return next();
            }).catch((e) => {
                return next(new Error("WS auth: Appcs internal DB error"));
            });
        })
    } else {
        next(new Error('WS Authentication Error'));
    }

});
io.on('connection', (socket) => {
    if (!socket.sentMydata) {
        logger.info('socket connect successful', `socket connected : ${socket.username}, id : ${socket.id}`);
        //get notif.
        socket.sentMydata = true;
    }
    socket.on(EVENTS.GET_NOTIF,()=>{
        notifdb.getNotifAndExpire(socket.username).then((notif)=>{
            let notifObj = JSON.parse(notif);
            if ( notif && notifObj.type === 'EXP' ){
                //TODO : why isn't the socket.emit working...
                console.log('SOCKETING EMITTING RECV NOTIF WITH OBJ :')
                console.log(notif);
                socket.emit(EVENTS.RECV_NOTIF,{type: 'EXP', expObject: notifObj.expObject});
            }
        })
    })
    socket.on('pong', () => {
        logger.info(`socket.on PONG`, `${socket.username} ponged.`);
    });
    socket.on('disconnect', () => {
        (async () => {
            if (!socket.movingToGms) {
                logger.info(`socket.on DISCONNECT`, `${socket.username} disconnected. Will get them to leave lobby or destroy it.`);
                const userObj = await db.getUser(socket.username);
                logger.info(`socket.on DISCONNECt`, `got userObj : ${JSON.stringify(userObj)}`);
                if (userObj && userObj.gameid) {
                    let game = await db.getGame(userObj.gameid);
                    if (game.creator === userObj.username) {
                        logger.info(`socket.on DISCONNECT`, `${userObj.username} is a game lobby creator. Deleting game ${game.uuid}...`);
                        //delete game
                        await db.leaveGame(userObj);
                        await Promise.all([chatroomdb.deleteRoomchat(game.uuid),db.deleteGame(game.uuid)]);
                        io.emit(EVENTS.GAME_DELETED, {
                            gameuuid: game.uuid
                        });
                        io.to(game.uuid).emit(EVENTS.LOBBY.LOBBY_GAME_DELETED);
                    } else {
                        //TODO: leaving game.
                        logger.info(`socket.on DISCONNECT`, `${userObj.username} is in a game. Leaving the game ${game.uuid}...`)
                        await db.leaveGame(userObj);
                        //note: .to() is the one for room in the main namespace.
                        let joinedRoom = userObj.gameid;
                        socket.leave(`${joinedRoom}`);
                        io.to(`${joinedRoom}`).emit(EVENTS.LOBBY.USER_LEFT, userObj.username);
                    }
                } else {
                    logger.info(`socket.on DISCONNECT`, ` socket with id ${socket.id} not in any game. Doing nothing...`)
                }
            } else {
                logger.info(`socket.on DISCONNECT`, `${socket.username} Disconnected but going to gms...`);

            }
        })().catch((e) => {
            logger.info(`socket.on DISCONNECT`, `${socket.username} Disconnected but going to gms...`);

        })
    });

    socket.on(EVENTS.LOBBY.MOVING_TO_GMS, (data, response) => {
        logger.info(`on MOVING_TO_GMS`, `${socket.username} moving to gms.. ok.`);
        socket.movingToGms = true;
        response({success: true});
    });
    /*
    AppCS Route.
    WS player Join game lobby (room)
    TODO: this socket route here is very costly (expensive).
    TODO: should be a way to make this more efficient.
     */
    //TODO: lrange the redislist here, for the client.
    socket.on(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN, (data, response) => {
        jwt.verify(data.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
                return;
            }
            const clientUsername = decoded.username;
            const roomName = data.gameid;
            if (socket.username !== decoded.username) {
                response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
                return;
            }
            db.getUser(clientUsername).then((user) => {
                if (user && user.gameid == null) {
                    if (!uuidvalidate(data.gameid)) {
                        logger.warn('on CLIENT_ATTEMPT_JOIN', `got invalid uuid here.`);
                        response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
                        return;
                    }
                    db.getGame(data.gameid).then((game) => {
                        if (game == undefined) {
                            logger.warn('on CLIENT_ATTEMPT_JOIN', `the game referred to by data.gameid is not real.`);
                            response({msg: EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK, error: 'no such game.'});
                            return;
                        }
                        if (game.players.length + 1 > game.gameoptions.numberOfMaxPlayers) {
                            response({
                                msg: EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK,
                                error: `Already ${game.gameoptions.numberOfMaxPlayers } people in lobby. Sorry..`
                            });
                            return;
                        }
                        else {
                            db.joinGame(clientUsername, roomName,user.level).then(() => {
                                socket.lastroom = Object.keys(socket.rooms)[0];
                                logger.info('ON CLIENT_ATTEMPT_JOIN', `socket.lastroom : ${JSON.stringify(socket.lastroom)}`)
                                socket.join(roomName);

                                logger.info('ON CLIENT_ATTEMPT_JOIN', `${clientUsername} joining socket room ${roomName}.`);
                                io.to(`${roomName}`)
                                    .emit(EVENTS.LOBBY.USER_JOINED, {username: clientUsername, level: user.level});
                                chatroomdb.getRoomchat(roomName).then((chats) => {
                                    response({
                                        msg: EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_ACK,
                                        players: game.players,
                                        stringifiedchat: chats
                                    });
                                })
                            }).catch((e) => {
                                logger.error('ON CLIENT_ATTEMPT_JOIN', `ACK ERROR for ${clientUsername}`)
                                response({msg: EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK});
                            });
                        }
                    }).catch((e) => {
                        logger.error(`on CLIENT_ATTEMPT_JOIN`, `ERROR db.getGame()`);
                        response({msg: EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK});
                    });
                }
                else {
                    response({msg: EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK});
                }
            }).catch((e) => {
                response({msg: EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK});
            });
        });
    });

    /*

    AppCS Route.
    WS player leave game

     */
    socket.on(EVENTS.LOBBY.CLIENT_LEAVE, (clientUserObj, response) => {
        logger.info('on CLIENT_LEAVE', `${clientUserObj.username}`);
        db.leaveGame(clientUserObj).then(() => {
            //note: .to() is the one for room in the main namespace.
            let joinedRoom = clientUserObj.gameid;
            socket.leave(`${joinedRoom}`);
            clientUserObj.socketid = null;
            io.to(`${joinedRoom}`).emit(EVENTS.LOBBY.USER_LEFT, clientUserObj.username);
            response(EVENTS.LOBBY.CLIENT_LEAVE_ACK);
        }).catch((e) => {
            response(EVENTS.LOBBY.CLIENT_LEAVE_NOACK);
        });
    })

    /*

    AppCS - utility route - no use case but can be requested (for unit testing purposes).
    WS CHECK_ROOM
    (gets all connected rooms).

     */
    socket.on(EVENTS.UTILS.CHECK_ROOM, (data, response) => {
        response(socket.rooms);
    })


    /* socket routes for chat.*/
    /* Data is  something like:

            {
            sender_username : 'USERNAME',
            namespace: null,
            message: "Whats up dawgs",
        }
     */
    //TODO: rpush to the redis list here.
    socket.on(EVENTS.EMIT_CHAT_MSG, (data) => {
        /* add things to the message */
        // assign a UUID to the message:
        data.msg_id = uuid();

        // assign a timestamp to the message;
        data.timestamp = moment.now();

        const namespace = data.namespace;
        if (namespace === null) {
            chatroomdb.pushToMainchat(JSON.stringify(data)).then(() => {
                io.emit(EVENTS.RECV_CHAT_MSG, data);
            })
        } else {
            chatroomdb.pushToRoomchat(namespace, JSON.stringify(data)).then(() => {
                io.to(namespace).emit(EVENTS.RECV_CHAT_MSG, data);
            })
        }
    });

    /*
    User invitations.
    accepts:
    invitation object
    {invitedBy, invitee, gameid, gamename}



     */
    socket.on(EVENTS.LOBBY.INVITE_USER, (data, callback) => {
        const invitedBy = data.invitedBy;
        const invitee = data.invitee;
        const gameid = data.gameid;
        const gamename = data.gamename;
        logger.info("on INVITE_USER", `got data : ${JSON.stringify(data)}`)
        if (!invitedBy || !invitee || !gameid || !gamename) {
            callback(EVENTS.LOBBY.INVITE_USER_FAIL);
            return;
        }
        db.getUser(invitee).then((user) => {
            if (!user) {
                callback(EVENTS.LOBBY.INVITE_USER_FAIL);
                return;
            }
            logger.info('on INVITE_USER', `user.gameid === gameid : ${user.gameid === gameid}`);
            if (user.gameid === gameid) {
                callback(`${invitee} is already in the lobby.`);
                return;
            }
            const socketid = user.socketid;
            io.to(socketid).emit(EVENTS.LOBBY.LOBBY_INVITATION, {
                invitedBy,
                gameid,
                gamename
            });
            callback(EVENTS.LOBBY.INVITE_USER_SUCCESS);
        }).catch((e) => {
            callback(EVENTS.LOBBY.INVITE_USER_FAIL);
        })

    })
    socket.on(EVENTS.LOBBY.KICK_OUT_USER, (data, callback) => {
        logger.info(`on KICK_OUT_USER`, `data supplied : ${JSON.stringify(data)}`);
        db.getUser(data.kickee).then((user) => {
            if (!user || user.gameid !== data.gameid) {
                callback(false);
                return;
            }
            //TODO: very inefficient.
            db.getGame(data.gameid).then((game) => {
                db.getUser(game.creator).then((creator) => {
                    if (creator.socketid === socket.id) {
                        socket.to(user.socketid).emit(EVENTS.LOBBY.KICKED_OUT);
                        callback(true);
                    } else {
                        callback(false);
                    }
                }).catch((e) => callback(false))
            }).catch((e) => callback(false))
        }).catch((e) => callback(false))
    });

})

// trapping exit signals.
const shutDown = async (signal) => {
    logger.warn(`signal ${signal}`, `shutting down gracefully..`);
    await db.closeConnection();
    await server.close();
    logger.warn(`signal ${signal}`, `OK. Bye... 👋`);
    process.exit(0);
}
process.on('SIGTERM', () => shutDown('SIGTERM'));
process.on('SIGINT', () => shutDown('SIGINT'));

/*
logger.info('doing testing...',`testing db.updateExpAndLevel()...`);
    exp.bulkIncrementExpAndLevel(
        [{username: 'a', expUpdate: 4000},
            {username: 'b', expUpdate: 3000}
        ])
        .then(() => {
            console.log('resolved.');
        }).catch((e) => {
        console.log(e);
    })
    */

