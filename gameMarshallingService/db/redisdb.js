let redis = require('redis');
// using bluebird for multi and exec transactions.
let logger = require('../log/gms_logger');
const bluebird = require('bluebird');
const cards = require('./constants/cardgameconstants');
const redisconnectionobject = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
};
let redisclient = null;
    redisclient = redis.createClient(redisconnectionobject);

redisclient.on('error',(err)=>{
    logger.error("redisdb",`redis connection error. ${JSON.stringify(err)}`);
    process.exit(1);
})

logger.info("redisdb",`redis connection established @ ${redisconnectionobject.host}:${redisconnectionobject.port}`)
//  <<<<< promisifying our redis commands >>>>>:
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

// NOTE don't mix application logic. Keep this middleware dumb. Validation should happen
// on the main gmsapp.js
/*

All the redis db does is handle the cards for us. nothing else
It is promise based. every redisdb method returns some promise due to its asynchronous nature.

{{{{   data structures   }}}}
for every game session GAMESESSIONID (note this is different from the lobby id),
we have:
-  GAMESESSIONID/pile - redis list for the pile.
-  GAMESESSIONID/nplayers - int of number of players.
-  GAMESESSIONID/counter - int of current counter (not % 13 though .this is absolute) - mod by 13 will be done by server.
-  GAMESESSIONID/slappedusers - redis sorted set for users who slapped. (used so that we can store the reaction time (rank)).
- GAMESESSIONID/playerinturn - the player who is supposed to throw. (index)
-GAMESESSIONID/turnoffset - the first player's index in the /players/ list. used  to calculate next player in turn.
-  GAMESESSIONID/players - redis list of the players
- GAMESESSIONID/sockettoplayer - redis hash of socketid: player username - used for in game identity validation.
- GAMESESSIONID/gamesecret - bcrypted secret that is sent to only players in the game lobby.
- GAMESESSIONID/match - 1 if is a match, or 0 if no match
- GAMESESSIONID/connectedplayers - redis set of connected players.

for every player with username USERNAME in GAMESESSIONID, we have:
-  GAMESESSIONID/player/USERNAME/hand - redis list of the user's hand.
- GAMESESSIONID/player/USERNAME/streaks - int of how many times (consecutively) a user has no pile.
- GAMESESSIONID/player/USERNAME/index - idx of player in the GAMESESSIONID/players list.

note: to get the curent card num, simply counter % 13.

{{{{    methods:    }}}}
State mutations:
-# initialise game
-# delete game
-# register a connected player by storing connected player's socketid, and in connected player set.
-#  set match
-# pop hand and push card to pile
        - returns popped cad.
-# pop card pile and transfer to loser's hand(identified by loser's username)
-# increment current counter (and get next player's turn, next counter).
-# set currentCounter (and get next counter, and next player)
-# register a user's slap (push username to slap hashtable, where key: value = username: slaptime(ms)) - remember that slaptime is determined client-side.
    - simultaneously returns how many users slapped
-# increment a person's streak.
    - return streak
-# set person's streak to 0

gets:
-# get current turn
-# get game card pile (in order) ( for testing purposes only)
-# get match
-# get whether a player slapped or not
-# get snapshot of game (everyone's piles)
-# get number of players.
-# get slappedUsers Sorted set. (for our gms app)
 */

const self = module.exports = {

    //      {{{{    State mutation methods    }}}}

    /* initialize new game with:
         players -  (array of usernames)
     returns:
     promise based.
        snapshot object:
        {
            username1: [1,5,2,6....],
            username2: [1,2,3,10,...],
            ...etc.
        }
    */
    initializeGame: (gamesessionid, gamesecret, players, cardsperplayer) => {
        //TODO: do we really need to be strict about card distribution here....
        return new Promise((resolve,reject)=>{
            let snapshotobj = {};
            let chain = redisclient.multi();
            // initialise the players' cards.
           players.forEach((player,idx)=> {
                   chain = chain.rpush(`${gamesessionid}/players`, player);
                   let hand = [];
                   Array.from(Array(cardsperplayer)).forEach((c) => {
                       hand.push(cards.fullcarddeck[Math.floor(Math.random() * cards.fullcarddeck.length)]);
                   });
                   snapshotobj[player] = hand;
                   chain = chain.rpush(`${gamesessionid}/player/${player}/hand`, ...hand);
                   

                    chain = chain.set(`${gamesessionid}/player/${player}/index`,idx);
           });
            // initialise the game variables.
           chain = chain.set(`${gamesessionid}/nplayers`, `${players.length}`);
           chain = chain.set(`${gamesessionid}/gamesecret`, `${gamesecret}`);
            chain = chain.set(`${gamesessionid}/counter`, 0);
            chain = chain.set(`${gamesessionid}/match`,0);
            chain = chain.set(`${gamesessionid}/playerinturn`,players[0]);
            chain= chain.set(`${gamesessionid}/turnoffset`,0); // player[0] has index 0.
            chain = chain.set(`${gamesessionid}/cardsperplayer`,`${cardsperplayer}`);
            // execute transaction.
            chain.execAsync().then((result)=>{
                console.log(`redisdb::initializeGame: playerinturn now : ${players[0]}`);
                resolve(snapshotobj);
            }).catch((e)=>{
                console.error("redisdb::initializeGame: ERROR");
                console.error(`reason for error: ${e}`);
                reject(e);
            })

    });
    },

    getCardsPerPlayer : (gamesessionid)=>{
        return new Promise((resolve,reject)=>{
            redisclient.getAsync(`${gamesessionid}/cardsperplayer`).then((i)=>{
                resolve(parseInt(i));
            }).catch((e)=>reject(e));
        });
    },
    deleteGame: (gamesessionid)=>{
         return new Promise((resolve,reject)=>{
             //note: returnArr is here because this is used for the scan.
             // scan is a recursive function.
            scanAsync(0,`${gamesessionid}/*`, (keys)=>{
                // below not needed.
                    redisclient.delAsync(...keys).then((retcode)=>{
                        if(keys.length === retcode)
                            resolve(retcode);
                        else{
                            console.error(`redisdb::deleteGame: warning: when trying to delete
                         ${gamesessionid},deleted ${retcode} instead of ${keys.length} 
                         found by scan`);
                            resolve(retcode);
                        }
                    }).catch(e=>reject(e));
               // })
            });
        });
    },

    setPlayerConnected: (gamesessionid,socketid,username)=>{
         return Promise.all([
             redisclient.hmsetAsync(`${gamesessionid}/sockettoplayer`, socketid,username),
             redisclient.sadd(`${gamesessionid}/connectedplayers`,username)
         ]);
    },

    setMatch : (gamesessionid,isMatch)=>{
        return redisclient.setAsync(`${gamesessionid}/match`,isMatch? 1: 0);
    },

    popHandToPile: (gamesessionid, player) => {
        return new Promise((resolve, reject) => {
            redisclient.rpopAsync(`${gamesessionid}/player/${player}/hand`).then((poppedCard) => {
                redisclient.rpushAsync(`${gamesessionid}/pile`, poppedCard).then(() => {
                    resolve(poppedCard);
                }).catch((e) => reject(e));
            }).catch((e) => reject(e));
        });
    },

    popAllPileToLoser: (gamesessionid, loser) => {
        return new Promise((resolve, reject) => {
            // 1. First, pop the pile.
            redisclient.llenAsync(`${gamesessionid}/pile`).then((len) => {
                let chain = redisclient.multi();
                    Array.from(Array(len)).map(m => {
                           chain =  chain.rpop(`${gamesessionid}/pile`)
                        });
                chain.execAsync()
                    .then((poppedpile) => {
                    console.log(`redisdb::popAllPileToLoser: poppedpile: ${JSON.stringify(poppedpile)}`);
                    // 2. , push the popped pile cards to loser.
                    redisclient.lpushAsync(`${gamesessionid}/player/${loser}/hand`, ...poppedpile)
                        .then((result) => {
                            console.log(`redisdb::popAllPileToLoser: resolving with poppedpile ${poppedpile} already pushed into ${loser}`);
                            resolve(poppedpile);
                        }).catch(e => reject(e));
                }).catch(e => reject(e));
            }).catch(e => reject(e));
        });
    },

    //NOTE: only increments the counter AND player in turn.
    // doesn't pop or anything. Forthis, pophandtopile must be called.
    // this is because we don't want to couple pop hand and increment.
    // what if e.g. the user pops hand on a match event (Which is an illegal op)?
    // resolves e.g.: {nextplayer: "asdawd",nextcounter: 4}
    incrementCurrentCounter: (gamesessionid) => {
        return new Promise((resolve, reject) => {
            let chain = redisclient.multi();
            chain
                .incr(`${gamesessionid}/counter`)
                .get(`${gamesessionid}/nplayers`)
                .get(`${gamesessionid}/turnoffset`)
                .lrange(`${gamesessionid}/players`,0,-1)
                .llen(`${gamesessionid}/players`);
            chain.execAsync().then((data)=>{
                const newcounter = parseInt(data[0]);
                const nplayers = parseInt(data[1]);
                const offset = parseInt(data[2]);
                let newindex = (offset + newcounter) % nplayers;
                redisclient.lindexAsync(`${gamesessionid}/players`, newindex).then((nextplayer) => {
                    console.log(`redisdb::incrementCurrentCounter: got next player: ${nextplayer}`);
                    redisclient.setAsync(`${gamesessionid}/playerinturn`, nextplayer).then(() => {
                        resolve({nextplayer: nextplayer,nextcounter: newcounter});
                    }).catch(e => reject(e));
                }).catch(e => reject(e))
                })
            });
    },

    setCurrentCounter: (gamesessionid,player)=>{
        return new Promise((resolve,reject)=>{
            let chain = redisclient.multi();
            chain
                .set(`${gamesessionid}/playerinturn`,player)
                .set(`${gamesessionid}/counter`,0)
                .get(`${gamesessionid}/player/${player}/index`);
            chain.execAsync().then((data)=>{
                redisclient.setAsync(`${gamesessionid}/turnoffset`,data[2]).then(()=>{
                    resolve({nextplayer: player,nextcounter: 0});
                }).catch((e)=>reject(e));
            }).catch((e)=>reject(e));
        });
    },

    slap: (gamesessionid, player, reactiontime) => {
        return new Promise((resolve, reject) => {
            redisclient.zaddAsync(`${gamesessionid}/slappedusers`, reactiontime, player).then(() => {
                redisclient.zrangebyscoreAsync(`${gamesessionid}/slappedusers`, '-inf', '+inf').then((slappedplayers) => {
                    resolve(slappedplayers);
                }).catch((e) => reject(e));
            }).catch((e) => reject(e));
        });
    },

    hasSlapped: (gamesessionid,player)=>{
        return new Promise((resolve,reject)=>{
            redisclient.zrankAsync(`${gamesessionid}/slappedusers`,player).then((result)=>{
                if (result == null)
                    resolve(0);
                else
                    resolve(1);
            }).catch((e)=>reject(e));
        })
    },

    resetSlaps: (gamesessionid)=>{
        return redisclient.delAsync(`${gamesessionid}/slappedusers`);
    },

    incrementStreak: (gamesessionid, player) => {
        return redisclient.incrAsync(`${gamesessionid}/player/${player}/streak`);
    },

    setZeroSreak: (gamesessionid, player) => {
        // we need for this promise thing to be here because 'set' returns 0.
        return new Promise((resolve, reject) => {
            redisclient.setAsync(`${gamesessionid}/player/${player}/streak`,0).then((newstreak) => {
                resolve(0);
            }).catch(e => reject(e));
        });
    },

    //      {{{{    Get methods    }}}}

    //get current turn
    // returns {playerinturn: ___, currentcounter: ___}
    getCurrentTurn: (gamesessionid) => {
            return new Promise((resolve,reject)=>{
                
                console.log(`redisdb::getCurrentTurn: trying to get: ${gamesessionid}/playerinturn`);
                let chain = redisclient.multi().get(`${gamesessionid}/playerinturn`).get(`${gamesessionid}/counter`);
                chain.execAsync().then((data)=>{
                    resolve({playerinturn: data[0],currentcounter: data[1]})
                }).catch((e)=>reject(e));
            });
    },

    getConnectedPlayers: (gamesessionid)=>{
        return redisclient.smembersAsync(`${gamesessionid}/connectedplayers`);
    },

    getMatch : (gamesessionid)=>{
        //return redisclient.getAsync(`${gamesessionid}/match`);

        return new Promise((resolve,reject)=>{
            redisclient.getAsync(`${gamesessionid}/match`).then((res)=>{
                resolve(parseInt(res));
            }).catch((e)=>reject(e));
        });
    },
    // get game card pile.
    getPile: (gamesessionid) => {
        return redisclient.lrangeAsync(`${gamesessionid}/pile,` ,0 , -1);
    },

    // get snapshot of the game, i.e. everyone's cards.
    getSnapshot: (gamesessionid) => {
        return new Promise((resolve, reject) => {
            scanAsync("0", `${gamesessionid}/player/*/hand`, (handkeys) => {
                let resultArr = [];
                let chain = redisclient.multi();
                handkeys.forEach(handkey=>{
                    chain = chain.lrange(handkey,0,-1);
                });

                chain.execAsync().then((result)=>{
                    handkeys.forEach((handkey,idx)=>{
                        const username = handkey.split('/')[2];
                        resultArr.push({username:username,hand: result[idx]});
                    });
                    resolve(resultArr);
                }).catch((e)=>reject(e));
            }).catch((e)=>reject(e));
        });
    },
    // get username from someone's socket id.
    getUsername: (gamesessionid,socketid)=>{
        return new Promise((resolve,reject)=>{
            redisclient.hmgetAsync(`${gamesessionid}/sockettoplayer`,socketid).then((data)=>{
                resolve(data[0]);
            }).catch((e)=>reject(e));
        });
    },
    // get number of players
    getNplayers: (gamesessionid)=>{
        return redisclient.getAsync(`${gamesessionid}/nplayers`);
    },

    // get slapped users, with their reaction times.
   getSlappedPlayers: (gamesessionid)=>{
       return new Promise((resolve,reject)=> {
               redisclient.zrangebyscoreAsync(`${gamesessionid}/slappedusers`,0,"+inf",'WITHSCORES').then((slappedusers)=>{
                   let retObj = [];
                   for(let i = 0; i +1 < slappedusers.length ; i+=2){
                       retObj.push({username: slappedusers[i], reactiontime: slappedusers[i+1]});
                   }
                   resolve(retObj);
           }).catch((e)=>reject(e));
       });
       },

    // get game secret - in bcrypt encrpyted form.
    getGameSecret : (gamesessionid)=>{
         return redisclient.getAsync(`${gamesessionid}/gamesecret`);
    },

    utils: {
        scanAsync: scanAsync,
        // addTo Hand is used for our testing purposes.
        addToHand: (gamesessionid,player,card)=>{
            return redisclient.rpushAsync(`${gamesessionid}/player/${player}/hand`,card);
        },
    }
   };

//helper stuff
// returns promises for scan just incase non 0
function scanAsync(cursor, pattern,callback,returnArr=[]) {
    return redisclient.scanAsync(cursor, "MATCH", pattern, "COUNT", "40").then(
        function (reply) {
            cursor = reply[0];
            let keys = reply[1];
            keys.forEach(function (key, i) {
                returnArr.push(key);
            });
            if (cursor === '0') {
                return callback(returnArr);
            } else {
                return scanAsync(cursor, pattern, callback, returnArr)
            }

        });
}

