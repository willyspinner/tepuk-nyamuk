const express = require('express');
const reload = require('reload');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const io = require('socket.io')();
require('dotenv').config({path: `${__dirname}/.appcs.test.env`});
const db = require('./db/db');
const EVENTS = require('./constants/socketEvents');
const uuidvalidate = require('uuid-validate');
// appcs environment var.

// constants
app.set('port', process.env.PORT || 3000);

// body parser
const bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

// server listening.
const server = app.listen(app.get('port'));

console.log(`app listening on ${app.get('port')}`);
io.attach(server);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
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
    db.getUser(req.body.username).then((user) => {
        if (!user) {
            console.log(`password to /appcs/user/new : ${req.body.password}`);
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
                res.status(200).json({
                    success: true,
                    token: token
                })
            }).catch((e) => {
                res.json({
                    success: false
                });
            })
        } else
        // a user is already defined with that name
            res.json({
                success: false,
                error: 'User already exists.'
            });
    })
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
    db.getUserSecrets(req.body.username).then((user) => {
        if (!user){
            res.json({
                success: false,
                error: ` no such user ${req.body.username}`
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
        res.json({
            success: true,
            games
        });
    }).catch((e) => {
        res.json({
            success: false,
            error:e
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
    jwt.verify(req.body.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
        if (err){
            res.json({
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
            res.json({
                success: true,
                game: newgame
            })
        }).catch((e) => {
            res.json({
                success: false,
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
    jwt.verify(req.body.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
        if (err)
            res.json({success: false, error: 'unauthorized.'});
        if(! uuidvalidate(req.params.gameid))
            res.json({
               success:false,error: 'not vailid game id.'
            });
        db.getGame(req.params.gameid).then((game) => {
            db.getUserSecrets(game.creator).then((creator) => {
                if (creator.socketid === req.body.socketid &&
                    creator.username === decoded.username) {
                    db.deleteGame(req.params.gameid).then(() => {
                        io.emit(EVENTS.GAME_DELETED, {
                            gameuuid: req.params.gameid
                        });

                        io
                            .to(req.params.gameId)
                            .emit(EVENTS.LOBBY.LOBBY_GAME_DELETED);
                        res.json({
                            success: true,
                        })
                    }).catch((e) => {
                        res.json({
                            success: false,
                        })
                    });
                }
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
    jwt.verify(req.body.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
        if (err)
            res.json({
                success: false,
                error: 'Unauthorized.'
            });
        db.getGame(req.params.gameid).then((game) => {
            db.getUserSecrets(game.creator).then((creator) => {
                if (creator.socketid === req.body.socketid) {
                    io
                        .to(req.params.gameid)
                        .emit(EVENTS.LOBBY.GAME_START);
                    //TODO: communicate with GMS.
                    res.json({
                        success: true
                    });
                }
                else
                    res.json({
                        success: false
                    });
            });
        });
    })
});
// WS routes: authenticated
// we use our middleware to deal with JWT auth
io.use(function (socket, next) {
    if (socket.handshake.query.token) {
        console.log(`SOCKET verifying token ${socket.handshake.query.token}`);
        jwt.verify(socket.handshake.query.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
            if (err)
                return next(new Error('WS Auth Error'));
            socket.username = decoded.username;
            socket.token = socket.handshake.query.token;//TODO: is this needed?
            next();
        })
    } else {
        next(new Error('WS Authentication Error'));
    }
}).on('connect', (socket) => {
    if (!socket.sentMydata) {
        console.log(`socket connected : ${socket.username}`);
        //NOTE: I don't know if this will work or not.
        db.loginUserSocketId(socket.username, socket.id).then(() => {
            socket.sentMydata = true;
        });
    }
    /*
    /*

    AppCS Route.
    WS player Join game lobby (room)
    TODO: this socket route here is very costly (expensive).
    TODO: should be a way to make this more efficient.

    TODO: also, there is a way of impersonation here. Be careful.
    TODO: FIX THIS ^^
     */
    socket.on(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN, (data,response) => {
        const clientUsername = data.username;
        const roomName = data.gameid;
        if(socket.username !== clientUsername){
            response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
            return;
        }
        db.getUser(clientUsername).then((user)=>{
            console.log(`user.gameid: ${user.gameid}`);
            if(user.gameid == null){
                if(! uuidvalidate(data.gameid)){
                    console.log(`got invalid uuid here.`);
                    response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
                    return;
                }
                    
                db.getGame(data.gameid).then((game)=>{
                    if (game == undefined) {
                        console.log(`the game referred to by data.gameid is not real.`);
                        response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
                        return;
                    }
                    else{
                        db.joinGame(clientUsername, roomName).then( () => {
                            socket.join(roomName);
                            io.to(`${roomName}`)
                                .emit(EVENTS.LOBBY.USER_JOINED, clientUsername);
                            response(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_ACK);
                        }).catch((e) => {
                            console.log(`NO ACK ERROR`);
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
});


reload(app);
