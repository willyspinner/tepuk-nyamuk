const express = require('express');
const reload = require('reload');
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

/*

NOTE: FOR SAFETY, THE CLIENT MUST NOT HAVE THEIR SOCKET ID's
ATTACHED TO HERE.
 */
/*

AppCS Route.
 GET /appcs/game : get all open games.
Shouldn't get the creator's socket id.

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

    game: {
        // game object.
    }

TESTED. OK.

 */
app.post('/appcs/game/create', (req, res) => {
    // the creator information is here already. (inside req.body.game object).
    db.createGame(JSON.parse(req.body.game)).then((newgame) => {
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
});


/*

AppCS Route.
DELETE /appcs/game/delete/:gameId: Delete game

POST body:

    socketid: "awdijaos2123eda",

TESTED. OK.
 */
app.delete('/appcs/game/delete/:gameid', (req, res) => {
    db.getGame(req.params.gameid).then((game) => {
        db.getUserSecrets(game.creator).then((creator)=>{
            if (creator.socketid === req.body.socketid) {
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


/*

AppCS Route.
POST /appcs/game/start/:gameId: Start game
NOTE: we communicate with our GMS here.
POST body:
{
    gameId:"awdnsoawd", // game id of one to be deleted.
    socketId:"ajwodmala" // socket id of requester
}
 */

app.post('/appcs/game/start/:gameid', (req, res) => {
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
});

io.of(MAIN_NAMESPACE).on('connect', (socket) => {
    if (!socket.sentMydata) {
        socket.emit(EVENTS.CONN_DETAILS, {socketId: socket.id});
        socket.sentMydata = true;
    }

    /*

    AppCS Route.
    WS player Join game lobby (room)

     */
    socket.on(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN, (clientUserObj, gameId) => {
        let roomName = gameId;
        // Could be a hash.
        db.joinGame(clientUserObj.username, gameId).then(() => {
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
