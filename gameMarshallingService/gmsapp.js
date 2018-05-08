require('dotenv').config({path: `${__dirname}/.gms.test.env`});
const redisdb = require('./db/redisdb');
const express= require('express');
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
app.post('/gms/game/create',(req,res)=>{
    if (!uuidvalidate(req.body.gameid))
        res.json({
            success:false,
            error: "gameid invalid"
        });
    // first we generate the game session.
    if(JSON.parse(req.body.players).length < 2)
        res.json({
            success:false,
            error: "too few players."
        })
    let cardsperplayer = 10; // this can be made a post body option (req.body) later if needed.
    let gamesessionid = crypto.createCipher('aes-128-cbc',process.env.GAME_SECRET)
        .update(req.body.gameid,'utf8','hex');
    gamesessionid = gamesessionid + gamesessionid.update.final('hex');
    // then we generate the game secret
    const gamesecret = crypto.createCipher('aes-128-cbc', process.env.GAME_SECRET)
        .update(gamesessionid,'utf8','hex');
    const gamesecretfinal =gamesecret +  gamesecret.update.final('hex');
    //  then we store the game secret in redis
    const salt = bcrypt.genSaltSync(10);
    const encryptedgamesecret = bcrypt.hashSync(gamesecretfinal,salt);
        redisdb.initializeGame(gamesessionid, encryptedgamesecret,
            JSON.parse(req.body.players), cardsperplayer)
            .then((result)=>{
                // then with the created game, we generate JWT gametoken.
                const gametoken = jwt.sign({gamesessionid: gamesessionid}, process.env.AUTH_TOKEN_SECRET,{expiresIn: 21600});
                res.status(200).json({
                    sucess:true,
                    gametoken: gametoken,
                    gamesecret: gamesecretfinal
                })
    }).catch(e=>res.json({
       success:false,
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
     roomsecret: awoinaodkawd129j12#
     gameid: "2012je2qdaw" - game id received from appcs
}

 */
io.use(function (socket, next) {
    if (socket.handshake.query.token) {
        jwt.verify(socket.handshake.query.token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
            if (err)
                return next(new Error('WS Auth Error'));
            redisdb.getGameSecret(decoded.gamesessionid).then((encrpytedrealsecret)=>{
                    if (bcrypt.compareSync(socket.handshake.query.roomsecret, encrpytedrealsecret))
                        next(); // authorized.
                    else
                        return next(new Error('WS Auth Error')); // TODO: what's with the returns?
            }).catch(e=>next(new Error("WS auth error: redisdb fail")));
        })
    } else {
        next(new Error('WS Authentication Error'));
    }
}).on('connect', (socket) => {
    //TODO: ws game events here.
    //TODO authentication. this is very week on authentication.
    // no things needed.
    // to reduce load ofcourse, client side validation is needed.
    socket.on(events.PLAYER_THREW,(data,response)=> {
        let username;
        let gamesessionid = socket.rooms[1]; // TODO: not sure if this is right for roomname checking.
        redisdb.getUsername(gamesessionid, socket.id).then((un) => {
            // see if it is match event.
            if(un === undefined )// TODO: we want to check whether un exists in the room.
                response({success:false,error:"autherror: no such username or roomname"});
            username = un;
            // find out if it already is a match event.
            //TODO should getMatch be first then currenTurn, or vice versa?
            redisdb.getMatch(gamesessionid).then((ismatch)=>{
                if(ismatch === 1)
                    response({
                        success:false,
                        error: "is currently in match"
                    });
                redisdb.getCurrentTurn(gamesessionid).then((playerinturn)=>{
                    if (playerinturn === username){
                        //throw card.
                        redisdb.popHandToPile(gamesessionid,username).then((poppedcard)=>{
                            // increment counter.
                            redisdb.incrementCurrentCounter(gamesessionid).then((newcounter)=>{
                                // check match event.
                                if(JSON.stringify(newcounter % 13) === poppedcard){
                                    // match event
                                    redisdb.setMatch(gamesessionid,true).then(()=>{
                                        // go on with next tick as normal, waiting for people
                                        // to find out that it is a match and slap.
                                        io.to(gamesessionid).emit(events.NEXT_TICK,{
                                            //TODO: need to standardise this next tick thing.
                                            match: true,
                                            nextpiletop: poppedcard // next top of pile.
                                        });
                                        response({
                                            success:true
                                        })
                                    });
                                }else{
                                    // just a normal throw.
                                    io.to(gamesessionid).emit(events.NEXT_TICK,{
                                        match: false,
                                        piletop: poppedcard
                                    });
                                    response({
                                        success:true
                                    })
                                }
                            })
                        })
                    }
                })
            })
        })
    });

    socket.on(events.PLAYER_SLAPPED,(data,response)=>{
        //TODO.
    });

});