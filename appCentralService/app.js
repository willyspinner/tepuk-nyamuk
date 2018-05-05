const express = require('express');
const reload = require('reload');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const io = require('socket.io')();
require('dotenv').config({path: `${__dirname}/.appcs.test.env`});
const db = require('./db/db');
const EVENTS = require('./constants/socketEvents');
const MAIN_NAMESPACE = '/main';
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

//TODOs: General todos
/*

1. Authify the important routes



 */


/*
POST: /appcs/game/user/new.
register a new user

POST BODY:
username
password
 */
// there should be some client side validation on NON NULL name.
app.post('/appcs/user/new',(req,res)=>{
    db.getUser(req.body.username).then((user)=>{
        if(!user) {
            const salt = 10;
            const userObj ={
                username: req.body.username,
             password: bcrypt.hashSync(req.body.password,salt)
            };
            db.registerUser(userObj).then(() => {
                let token = jwt.sign({username:userObj.username,password:userObj.password},
                    process.env.AUTH_TOKEN_SECRET,{
                        expiresIn: 43200 // secs, so 12 hours.
                    });
                res.status(200).json({
                    success:true,
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
                success:false,
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
app.post('/appcs/user/auth',(req,res)=>{
    db.getUser(req.body.user).then((user)=>{
        const passwordValid = bcrypt.compareSync(req.body.password,user.password);
        if(passwordValid){
            let token = jwt.sign({username:user.username,password:user.password},
                process.env.AUTH_TOKEN_SECRET,
                {expiresIn: 43200});
            res.status(200).send({
                success:true,
                token: token
            });
        }else{
            res.status(401).send({
                success:false,
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
    db.queryOpenGames().then((games) => {
        res.json({
            success: true,
            games
        });
    }).catch((e) => {
        res.json({
            success: false,
        })
    });
});

/*

AppCS Route.
 POST /appcs/game/create/:gameId : Create game

POST body:

    game: game object
    token

TESTED. OK.

 */
app.post('/appcs/game/create', (req, res) => {
    // the creator information is here already. (inside req.body.game object).
    jwt.verify(req.body.token,process.env.AUTH_TOKEN_SECRET,(err,decoded)=>{
        if(err)
            res.json({
                success:false,
                error: 'NOT AUTHENTICATED.'
            });
        let game = req.body.game;
        game.creator = decoded.username;
        db.createGame(JSON.parse(game)).then((newgame) => {
            // link used to go to the lobby page.
            io.of(MAIN_NAMESPACE).emit(EVENTS.GAME_CREATED, {
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
    jwt.verify(req.body.token,process.env.AUTH_TOKEN_SECRET,(err,decoded)=> {
        if(err)
            res.json({success:false, error:'unauthorized.'});

        db.getGame(req.params.gameid).then((game) => {
            db.getUserSecrets(game.creator).then((creator) => {
                if (creator.socketid === req.body.socketid &&
                creator.username === decoded.username) {
                    db.deleteGame(req.params.gameid).then(() => {
                        io.of(MAIN_NAMESPACE).emit(EVENTS.GAME_DELETED, {
                            gameid: req.params.gameid
                        });
                        io.of(MAIN_NAMESPACE)
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
    jwt.verify(req.body.token, process.env.AUTH_TOKEN_SECRET,(err,decoded)=>{
        if(err)
            res.json({
                success:false,
                error: 'Unauthorized.'
            });
        db.getGame(req.params.gameid).then((game) => {
            db.getUserSecrets(game.creator).then((creator) => {
                if (creator.socketid === req.body.socketid) {
                    io.of(MAIN_NAMESPACE)
                        .to(req.params.gameid)
                        .emit(EVENTS.LOBBY.GAME_START);
                    //TODO
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
io.use(function(socket,next){
    if(socket.handshake.token){
        jwt.verify(socket.handshake.token, process.env.AUTH_TOKEN_SECRET,(err,decoded)=>{
            if(err)
                return next(new Error('WS Auth Error'));

            socket.username = decoded.username;
            next();
        })
    }else{
        next(new Error('WS Authentication Error'));
    }
}).of(MAIN_NAMESPACE).on('connect', (socket) => {
    if (!socket.sentMydata) {
        //NOTE: I don't know if this will work or not.
        const asyn = async ()=>await db.loginUserSocketId(socket.username, socket.id);
        asyn();
        socket.sentMydata = true;
    }
    /*
    /*

    AppCS Route.
    WS player Join game lobby (room)

     */
    socket.on(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN, (clientUserObj, gameId) => {
        let roomName = gameId;
        // Could be a hash.
        db.joinGame(clientUserObj.username, roomName).then(() => {
            socket.join(roomName);
            clientUserObj.socketid= null;
            io.of(MAIN_NAMESPACE)
                .to(`${gameId}`)
                .emit('userJoined', clientUserObj);
            socket.emit(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_ACK);
        }).catch((e) => {
            socket.emit(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_NOACK);
        });
    });

    /*

    AppCS Route.
    WS player leave game

     */
    socket.on(EVENTS.LOBBY.CLIENT_LEAVE, (clientUserObj) => {
        db.leaveGame(clientUserObj).then(() => {
            //note: .to() is the one for room in the main namespace.
            let joinedRoom = clientUserObj.joinedRoom;
            socket.leave(`${joinedRoom}`);
            clientUserObj.socketid= null;
            io.of(MAIN_NAMESPACE).to(`${joinedRoom}`).emit('userLeft', clientUserObj);
            socket.emit(EVENTS.LOBBY.CLIENT_LEAVE_ACK);
        }).catch((e) => {
            socket.emit(EVENTS.LOBBY.CLIENT_LEAVE_NOACK);
        });
    })
});


reload(app);
