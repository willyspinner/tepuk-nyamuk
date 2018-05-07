let redis = require('redis');
const cards = require('./constants/cardgameconstants');
const redisconnectionobject = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
}
const promisify = require('util').promisify;
let redisclient = redis.createClient(redisconnectionobject);
//  <<<<< promisifying our redis commands >>>>>:
// lists commands:
const redisRpushAsync = promisify(redisclient.rpush).bind(redisclient);
const redisRpopAsync = promisify(redisclient.rpop).bind(redisclient);
const redisLpushAsync = promisify(redisclient.lpush).bind(redisclient); // for popping pile to hand.
const redisLrangeAsync = promisify(redisclient.lrange).bind(redisclient);
const redisLlenAsync = promisify(redisclient.llen).bind(redisclient);
const redisLindexAsync = promisify(redisclient.lindex).bind(redisclient);
// get and set commands:
const redisSetAsync = promisify(redisclient.set).bind(redisclient);
const redisGetAsync = promisify(redisclient.get).bind(redisclient);
const redisIncrAsync = promisify(redisclient.incr).bind(redisclient);
// sorted set commands
const redisZaddAsync = promisify(redisclient.zadd).bind(redisclient);
const redisZcountAsync = promisify(redisclient.zcount).bind(redisclient);
const redisZrangeByScoreAsync = promisify(redisclient.zrangebyscore).bind(redisclient);
// scan command
const redisScanAsync = promisify(redisclient.scan).bind(redisclient);
// del command:
const redisDelAsync = promisify(redisclient.del).bind(redisclient);

// NOTE don't mix application logic. Keep this middleware dumb. Validation should happen
// on the main gmsapp.js
/*

All the redis db does is handle the cards for us. nothing else

{{{{   data structures   }}}}
for every game session GAMESESSIONID (note this is different from the lobby id),
we have:
-  GAMESESSIONID/pile - redis list for the pile.
-  GAMESESSIONID/nplayers - int of number of players.
-  GAMESESSIONID/counter - int of current counter (not % 13 though .this is absolute) - mod by 13 will be done by server.
-  GAMESESSIONID/slappedusers - redis sorted set for users who slapped.
- GAMESESSIONID/playerinturn - the player who is supposed to throw.
-  GAMESESSIONID/players - redis set of the players (ordered).
- GAMESESSIONID/gamesecret - bcrypted secret that is sent to only players in the game lobby.

for every player with username USERNAME in GAMESESSIONID, we have:
-  GAMESESSIONID/player/USERNAME/hand - redis list of the user's hand.
- GAMESESSIONID/player/USERNAME/streaks - int of how many times (consecutively) a user has no pile.


{{{{    methods:    }}}}
State mutations:
-# initialise game
-# delete game
-# pop hand and push card to pile
        - returns popped card.
-# pop card pile and transfer to loser's hand(identified by loser's username)
-# increment current counter (and get next player's turn).
-# register a user's slap (push username to slap hashtable, where key: value = username: slaptime(ms)) - remember that slaptime is determined client-side.
    - simultaneously returns how many users slapped
-# increment a person's streak.
    - return streak
-# set person's streak to 0

gets:
-# get current turn
-# get game card pile (in order) ( for testing purposes only)
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
        let snapshotobj = {};
        return new Promise((resolve, reject) => {
            Promise.all(
                players.map((player) => {
                    console.log(`returning promise for ${player}`);
                    return new Promise((resolve, reject) => {
                        Promise.all([
                            redisRpushAsync(`${gamesessionid}/players`, player),
                            Promise.all(
                                Array.from(Array(cardsperplayer)).map((c) => {
                                    console.log(`adding card to ${gamesessionid}/${player}`);
                                    //TODO: surely we can just rpush a whole array at once here... why so unecessary...
                                    return redisRpushAsync(`${gamesessionid}/player/${player}/hand`, `${cards.fullcarddeck[Math.floor(Math.random() * cards.fullcarddeck.length)]}`);
                                })
                            ),
                        ]).then((data) => {
                            console.log(`resolving for player ${player}`);
                            resolve();
                        }).catch((e) => reject(e));
                    });
                }).concat(
                    [
                        redisSetAsync(`${gamesessionid}/nplayers`, `${players.length}`),
                        redisSetAsync(`${gamesessionid}/gamesecret`, `${gamesecret}`),
                        redisSetAsync(`${gamesessionid}/counter`, 0),
                    ]
                )).then(() => {
                Promise.all([
                    ...players.map((player) => {
                        return redisLrangeAsync(`${gamesessionid}/player/${player}/hand`, 0, cardsperplayer - 1).then((data) => {
                            snapshotobj[player] = data;
                        });
                    }),
                    redisSetAsync(`${gamesessionid}/playerinturn`,players[0]) // first player to play is [0].
                    ]).then((data) => {
                    resolve(snapshotobj);
                }).catch((e) => {
                    console.log(`REJECT 1`);
                    reject(e)
                });
            }).catch((e) => {
                    console.log(`REJECT 2`);
                    reject(e)
                }
            );
        })
    },

    deleteGame: (gamesessionid)=>{
         return new Promise((resolve,reject)=>{
             //note: returnArr is here because this is used for the scan.
             // scan is a recursive function.
            scanAsync(0,`${gamesessionid}/*`, (keys)=>{
                redisDelAsync(...keys).then((retcode)=>{
                    if(keys.length === retcode)
                        resolve(retcode);
                    else{
                        console.error(`redisdb::deleteGame: when trying to delete
                         ${gamesessionid},deleted ${retcode} instead of ${keys.length} 
                         found by scan`);
                        resolve(retcode);
                    }
                }).catch(e=>reject(e));
            });
        });
    },
    //NOTE: gamescret should already be encrypted and salted here.
    setGameSecret: (gamesessionid,gamesecret)=>{
        return new Promise((resolve,reject)=>{
            redisSetAsync(`${gamesessionid}/gamesecret`,gamesecret).then((retcode)=>{
                resolve(retcode);
            }).catch(e=>reject(e));
        });
    },
    popHandToPile: (gamesessionid, player) => {
        return new Promise((resolve, reject) => {
            redisRpopAsync(`${gamesessionid}/player/${player}/hand`).then((poppedCard) => {
                redisRpushAsync(`${gamesessionid}/pile`, poppedCard).then(() => {
                    resolve(poppedCard);
                }).catch((e) => reject(e));
            }).catch((e) => reject(e));
        });
    },

    popPileToLoser: (gamesessionid, loser) => {
        return new Promise((resolve, reject) => {
            // 1. First, pop the pile.
            redisLlenAsync(`${gamesessionid}/pile`).then((len) => {
                Promise.all(
                    Array.from(Array(len)).map(m =>
                        redisRpopAsync(`${gamesessionid}/pile`)
                    )
                ).then((poppedpile) => {
                    console.log(`poppedpile: ${JSON.stringify(poppedpile)}`);
                    // 2. , push the popped pile cards to loser.
                    redisLpushAsync(`${gamesessionid}/player/${loser}/hand`, ...poppedpile)
                        .then((result) => {
                            resolve();
                        }).catch(e => reject(e));
                }).catch(e => reject(e));
            }).catch(e => reject(e));
        }).catch(e => reject(e));
    },

    //NOTE: only increments the counter AND player in turn.
    // doesn't pop or anything. Forthis, pophandtopile must be called.
    // this is because we don't want to couple pop hand and increment.
    // what if e.g. the user pops hand on a match event (Which is an illegal op)?
    incrementCurrentCounter: (gamesessionid) => {
        return new Promise((resolve, reject) => {
            redisIncrAsync(`${gamesessionid}/counter`).then((newcounter) => {
                redisGetAsync(`${gamesessionid}/nplayers`).then((nplayers) => {
                    redisLindexAsync(`${gamesessionid}/players`, newcounter % nplayers).then((nextplayer) => {
                        redisSetAsync(`${gamesessionid}/playerinturn`, nextplayer).then((retcode) => {
                            resolve(nextplayer);
                        }).catch(e => reject(e));
                    }).catch(e => reject(e))
                }).catch(e => reject(e));
            }).catch(e => reject(e));
        });
    },

    slap: (gamesessionid, player, reactiontime) => {
        return new Promise((resolve, reject) => {
            redisZaddAsync(`${gamesessionid}/slappedusers`, reactiontime, player).then(() => {
                redisZrangeByScoreAsync(`${gamesessionid}/slappedusers`, '-inf', '+inf').then((slappedplayers) => {
                    resolve(slappedplayers);
                }).catch((e) => reject(e));
            }).catch((e) => reject(e));
        });
    },

    incrementStreak: (gamesessionid, player) => {
        return new Promise((resolve, reject) => {
            redisIncrAsync(`${gamesessionid}/player/${player}/streak`).then((newstreak) => {
                resolve(newstreak);
            }).catch(e => reject(e));
        });
    },

    setZeroSreak: (gamesessionid, player) => {
        return new Promise((resolve, reject) => {
            redisSetAsync(`${gamesessionid}/player/${player}/streak`,0).then((newstreak) => {
                resolve(0);
            }).catch(e => reject(e));
        });
    },

    //      {{{{    Get methods    }}}}

    // get current turn. NOTE: idt we need this.
    getCurrentTurn: (gamesessionid) => {
        return new Promise((resolve, reject) => {
            redisGetAsync(`${gamesessionid}/playerinturn`).then(playerinturn => {
                resolve(playerinturn);
            }).catch((e) => reject(e));
        });
    },

    // get game card pile.
    getPile: (gamesessionid) => {
        return new Promise((resolve, reject) => {
            redisLlenAsync(`${gamesessionid}/pile`).then(len => {
                redisLrangeAsync(`${gamesessionid}/pile`).then(pile => {
                    resolve(pile);
                }).catch(e => reject(e));
            }).catch(e => reject(e));
        }).catch(e => reject(e));
    },

    // get snapshot of the game, i.e. everyone's cards.
    getSnapshot: (gamesessionid) => {
        return new Promise((resolve, reject) => {
            let returnArr = [];
            scanAsync("0", `${gamesessionid}/player/*/hand`, (handkeys) => {
                console.log(`handkeys got: ${JSON.stringify(handkeys)}`);
                Promise.all(
                    handkeys.map(handkey =>
                        new Promise((res1, rej1) => {
                            redisLlenAsync(handkey).then(len => {
                                redisLrangeAsync(handkey, 0, len - 1).then((hand) => {
                                    const username = handkey.split('/')[2];
                                    res1({username: username, hand: hand});
                                })
                            }).catch(e => rej1(e));
                        })
                    )
                ).then((hands) => {
                    // hands is an array containing elements like:
                    // {username:username, hand: [c1,c2,c3,...]}
                    resolve(hands);
                }).catch(e => reject(e))
            }).catch(e => {
                console.log(`redisdb::getSnapshot : scanAsync failed!`);
                reject(e);
            });
        });
    },

    // get number of players
    getNplayers: (gamesessionid)=>{
        return new Promise((res,rej)=>{
            redisGetAsync(`${gameasessionid}/nplayers`).then((len)=>{
                res(len);
            }).catch((e)=>rej(e));
        });
    },

    // get slapped users, with their reaction times.
   getSlappedPlayers: (gamesessionid)=>{
       return new Promise((resolve,reject)=> {
               redisZrangeByScoreAsync(`${gamesessionid}/slappedusers`,0,"+inf",'WITHSCORES').then((slappedusers)=>{
                   let retObj = [];
                   for(let i = 0; i +1 < slappedusers.length ; i+=2){
                       retObj.push({username: slappedusers[i], reactiontime: slappedusers[i+1]});
                   }
                   resolve(retObj);
           }).catch((e)=>reject(e));
       });
       },

    // get game secret
    getGameSecret : (gamesessionid)=>{
     return new Promise((resolve,reject)=>{
         redisGetAsync(`${gamesessionid}/gamesecret`).then((gamesecret)=>{
             resolve(gamesecret);
         }).catch(e=>reject(e));
     });
    },
    utils: {
        scanAsync: scanAsync,
    }
   }

//helper stuff
// returns promises for scan just incase non 0
function scanAsync(cursor, pattern,callback,returnArr=[]) {
    return redisScanAsync(cursor, "MATCH", pattern, "COUNT", "40").then(
        function (reply) {
            cursor = reply[0];
            var keys = reply[1];
            keys.forEach(function (key, i) {
                returnArr.push(key);
            });
            if (cursor === '0') {
                return callback(returnArr);
            } else {
                return scanAsync(cursor, pattern, callback, returnArr)
            }

        });
};

