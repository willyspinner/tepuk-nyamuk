const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const moment = require('moment');
const app = express();
const io = require('socket.io')();
require('dotenv').config({path: `${__dirname}/.appcs.test.env`});
const db = require('./db/db');
const EVENTS = require('./constants/socketEvents');
const uuidvalidate = require('uuid-validate');
const logger = require('./log/appcs_logger');
const request = require('request');
// appcs environment var.

// constants

if (process.env.APPCS_PORT){
    app.set('port',process.env.APPCS_PORT);
}else{
    app.set('port', process.env.PORT || 3000);
}
// body parser
const bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

// server listening.
const server = app.listen(app.get('port'));

io.attach(server);
logger.info('app.js',`app listening on ${app.get('port')}`);

app.use(function(req, res, next) {
    //NOTEDIFF: Changed ALLOW ORIGIN to our thing only in production.
    //TODO: load these configs in runtime in consul.
    res.header("Access-Control-Allow-Origin", process.env.TEPKENV === 'production' ? process.env.DOMAINNAME: '*');
    res.header("Access-Control-Allow-Methods","POST, GET, OPTIONS, DELETE, ")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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
    if (!req.body.username|| !req.body.password) {
        res.status(400).json({
            success: false,
            error: 'invalid details'
        });
        return;
    }
    db.getUser(req.body.username).then((user) => {
        if(!user){
            const salt = bcrypt.genSaltSync(10);
            const userObj = {
                username: req.body.username,
                password: bcrypt.hashSync(req.body.password, salt)
            };
            db.registerUser(userObj).then(() => {
                let token = jwt.sign({username: userObj.username},
                    process.env.AUTH_TOKEN_SECRET, {
                        expiresIn: 43200 // secs, so 12 hours.
                    });
                res.status(201).json({
                    success: true,
                    token: token
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
    console.log(`POST to /appcs/user/auth. body: ${JSON.stringify(req.body)}`);
    if(!req.body.username){
        res.status(400).json({
            success: false,
            error: `invalid request.`
        });
        return;
    }
    db.getUserSecrets(req.body.username).then((user) => {
        if (!user){
            res.status(403).json({
                success: false,
                error: ` no such user: ${req.body.username}.`
            });
            return;
        }
        const passwordValid = bcrypt.compareSync(req.body.password, user.password);
        if (passwordValid) {
            let token = jwt.sign({username: user.username },
                process.env.AUTH_TOKEN_SECRET,
                {expiresIn: 43200});
            res.status(200).json({
                success: true,
                token: token
            });
        } else {
            res.status(401).json({
                success: false,
                token: null
            })
        }
    }).catch((e)=>{
        res.status(500).json({success:false});
    })

})


/*

AppCS Route.
 GET /appcs/game : get all open games.
Shouldn't get the creator's socket id.

NOTE: FOR SAFETY, THE USERS MUST NOT HAVE THEIR SOCKET ID's
ATTACHED IN THE RESPONSE BODY OF THIS ROUTE:
TESTED . OK.
 */

app.get('/appcs/game', (req, res) => {
    console.log(` appCS::app.js: querying open games...`);
    db.queryOpenGames().then((games) => {
        console.log(`responding with games: ${JSON.stringify(games)}`);
        res.status(200).json({
            success: true,
            games
        });
    }).catch((e) => {
        res.status(500).json({
            success: false,
            error:JSON.stringify(e)
        })
    });
});

/*

AppCS Route.
 POST /appcs/game/create/:gameId : Create game

POST body:

    game: game object
    token


 */
app.post('/appcs/game/create', (req, res) => {
    // the creator information is here already. (inside req.body.game object).
    if(!req.body.token || !req.body.game){
        res.status(400).json({
            success:false,
            error:"Bad request."
        });
        return;
    }
    jwt.verify(req.body.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
        if (err){
            res.status(401).json({
                success: false,
                error: 'NOT AUTHENTICATED.'
            });
            return;
        }
        let game = req.body.game;
        game.creator = decoded.username;
        db.createGame(JSON.parse(game)).then((newgame) => {
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
    if(!req.body.token || !req.body.socketid ){
        res.status(400).json({success:false});
        return;
    }
    if(! uuidvalidate(req.params.gameid)){
        res.status(400).json({
            success:false,
            error: 'invalid game id.'
        });
        return;
    }
    jwt.verify(req.body.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
        if (err){
            res.status(401).json({success: false, error: 'unauthorized.'});
            return;
        }

        logger.info(`AppCS::app.js::delete game route`,` jwt signature verified`);
        console.log(`get game user id: ${req.params.gameid}`);
        db.getGame(req.params.gameid).then((game) => {
            if (!game){
                res.status(404).json({
                    success:false,
                    error:"no such game."
                });
                return;
            }
            db.getUserSecrets(game.creator).then((creator) => {
                logger.info("DELETE /appcs/game/delete/:gameid",`got user secrets : ${JSON.stringify(creator)}`);
                logger.info("DELETE /appcs/game/delete/:gameid",`trying to authenticate deleter...`);
                logger.info("DELETE /appcs/game/delete/:gameid",`creator.socketid : ${creator.socketid}`);
                logger.info("DELETE /appcs/game/delete/:gameid",`req.body.socketid : ${req.body.socketid}`);
                logger.info("DELETE /appcs/game/delete/:gameid",`creator.username: ${creator.username}`);
                logger.info("DELETE /appcs/game/delete/:gameid",`decoded.username : ${decoded.username}`);
                if(1 ==1 )
                    logger.info("DELETE /appcs/game/delete/:gameid","indeed..");
                if (creator.socketid === req.body.socketid && creator.username === decoded.username) {
                    logger.info(`AppCS::app.js::delete game route`,` credentials verified for deletion.`);
                    db.deleteGame(req.params.gameid).then(() => {
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
                            error:"here1"
                        })
                    });
                }else {
                    res.status(401).json({
                        success:false,
                        error:"unauthorized."
                    });
                }
            }).catch((e) => {
                    logger.error("DELETE /appcs/game/delete/:gameid",`${JSON.stringify(e)}`)
                    res.status(500).json({
                        success: false,
                        error:"here2 berdog"
                    })
                });
        }).catch((e) => {
                res.status(500).json({
                    success: false,
                    error:"here3"
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
    if(!req.body.token ||!req.body.socketid){
        res.status(400).json({
            success:false,
            error:"invalid details."
        })
        return;
    }
    jwt.verify(req.body.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
        if (err){
            res.status(401).json({
                success: false,
                error: 'Invalid token.'
            });
            return;
        }
        logger.info('POST /appcs/game/start/:gameid', `decoded jwt token: ${JSON.stringify(decoded)}`);
        db.getGame(req.params.gameid).then((game) => {
            if(!game){
                res.status(404).json({
                    success:false,
                    error:"no such game."
                });
                return;
            }
            logger.info("POST /appcs/game/start/:gameid",`got game ${JSON.stringify(game)}`);
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
                            url:`http://${GMS_HOST}:${GMS_PORT}/gms/game/create`,
                            form: {
                                gameid: req.params.gameid,
                                gamename: "zz game", // NOTE:  we don't actually need the game name i think.
                                players: game.players// an array of the usernames.
                            },
                        },
                        (err, resp, body) => {
                            if (err)
                            {
                                res.status(500).json({
                                    success:false,
                                    error:"server request error."
                                })
                                return;
                            }
                            const response = JSON.parse(body);

                            if(!response.success){
                                res.status(400).json({
                                    success:false,
                                    error:"bad request",
                                    err2: `${JSON.stringify(response.error)}`
                                });
                                return;
                            }
                            //oops. forgot to add this chunk below:
                            db.startGame(req.params.gameid).then(()=>{
                                // emit to main lobby that this game is starting..

                                //TODO: should this be  a game_deleted thing... race condition?
                                //IDEA: make EVENTS.GAME_STARTED event?
                                io.emit(EVENTS.GAME_STARTED,{gameuuid: req.params.gameid} );
                                io
                                    .to(req.params.gameid)
                                    .emit(EVENTS.LOBBY.GAME_START,{
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
            }).catch((e)=>{
                res.status(500).json({
                    success:false,
                    error:'server error 1',
                    e: JSON.stringify(e)
                })
            });
        }).catch((e)=>{
            res.status(500).json({
                success:false,
                error:'server error 2',
                e :JSON.stringify(e)
            })
        });
    })
});


// health check
app.get('/health', (req,res)=>{
    logger.info("app.js: GET /health","Consul health checkup...");
    res.sendStatus(200);
})
// WS routes: authenticated
// we use our middleware to deal with JWT auth
io.use(function (socket, next) {
    if (socket.handshake.query.token) {
        logger.info(`socket.io authentication middleware`,`verifying token ${socket.handshake.query.token}`);
        jwt.verify(socket.handshake.query.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
            if (err)
                return next(new Error('WS Auth Error'));
            socket.username = decoded.username;
            socket.token = socket.handshake.query.token;//TODO: is this needed?
            db.loginUserSocketId(socket.username, socket.id).then(() => {
                socket.sentMydata = true;
                 return next();
            }).catch((e)=>{
                return next(new Error("WS auth: Appcs internal DB error"));
            });
        })
    } else {
        next(new Error('WS Authentication Error'));
    }
}).on('connect', (socket) => {
    if (!socket.sentMydata) {
        logger.info('socket connect successful',`socket connected : ${socket.username}, id : ${socket.id}`);

        //NOTE: I don't know if this will work or not.
        //NOTEDIFF: PUTTING THE BELOW IS A RACE CONDition fOR THE TEST! WE NEED TO LOG THE SOCKET ID FIRST BEFORE
        //NOTEDIFF: IT IS ACTUALLY CONNECTED..
        /*
        db.loginUserSocketId(socket.username, socket.id).then(() => {
            socket.sentMydata = true;
        });
        */
    }
    /*
    /*

    AppCS Route.
    WS player Join game lobby (room)
    TODO: this socket route here is very costly (expensive).
    TODO: should be a way to make this more efficient.
     */
    socket.on(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN, (data,response) => {
        jwt.verify(data.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
            if (err){
                response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
                return;
            }
        const clientUsername = data.username;
        const roomName = data.gameid;
        if(socket.username !== clientUsername || clientUsername !== decoded.username){
            response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
            return;
        }
        db.getUser(clientUsername).then((user)=>{
            if(user.gameid == null){
                if(! uuidvalidate(data.gameid)){
                    logger.warn('on CLIENT_ATTEMPT_JOIN',`got invalid uuid here.`);
                    response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
                    return;
                }
                    
                db.getGame(data.gameid).then((game)=>{
                    if (game == undefined) {
                        logger.warn('on CLIENT_ATTEMPT_JOIN',`the game referred to by data.gameid is not real.`);
                        response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
                        return;
                    }
                    else{
                        db.joinGame(clientUsername, roomName).then( () => {
                            socket.lastroom = Object.keys(socket.rooms)[0];
                           logger.info('ON CLIENT_ATTEMPT_JOIN', `socket.lastroom : ${JSON.stringify(socket.lastroom)}`)
                            socket.join(roomName);
                            
                            logger.info('ON CLIENT_ATTEMPT_JOIN',`${clientUsername} joining socket room ${roomName}.`);
                            io.to(`${roomName}`)
                                .emit(EVENTS.LOBBY.USER_JOINED, clientUsername);
                            response({msg: EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_ACK,
                                players:game.players});
                        }).catch((e) => {
                            logger.error('ON CLIENT_ATTEMPT_JOIN',`ACK ERROR for ${clientUsername}`)
                            response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
                        });
                    }
                }).catch((e)=>{
                    console.log(`ERROR getGame`);
                    response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
                });
            }
            else {
                console.log(`user game id already defined..`);
                response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
            }
        }).catch((e)=>{
            response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
        });
        });
    });

    /*

    AppCS Route.
    WS player leave game

     */
    socket.on(EVENTS.LOBBY.CLIENT_LEAVE, (clientUserObj,response) => {
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
    socket.on(EVENTS.UTILS.CHECK_ROOM,(data,response)=>{
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
    socket.on(EVENTS.EMIT_CHAT_MSG,(data)=>{
        /* add things to the message */
        // assign a UUID to the message:
        data.msg_id = uuid();

        // assign a timestamp to the message;
        data.timestamp = moment.now();

        const namespace = data.namespace;
        if (namespace ===null ){
            io.emit(EVENTS.RECV_CHAT_MSG, data);
        }else {
            io.to(namespace).emit(EVENTS.RECV_CHAT_MSG, data);
        }
    });

});

