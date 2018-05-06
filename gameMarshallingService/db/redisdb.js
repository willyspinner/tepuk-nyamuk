let redis = require('redis');
const cards = require('./constants/cardgameconstants');
const redisconnectionobject = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
}
const promisify = require('util').promisify;
let redisclient = redis.createClient(redisconnectionobject);
// promisifying our redis commands:
const redisRpushAsync = promisify(redisclient.rpush).bind(redisclient);
const redisSetAsync = promisify(redisclient.set).bind(redisclient);
const redisLrangeAsync = promisify(redisclient.lrange).bind(redisclient);


// NOTE don't mix application logic. Keep this middleware dumb. Validation should happen
// on the main gmsapp.js
/*

All the redis db does is handle the cards for us. nothing else

{{{{   data structures   }}}}
for every game session GAMESESSIONID (note this is different from the lobby id),
we have:
-  GAMESESSIONID/cardpile - redis list for the pile.
-  GAMESESSIONID/nplayers - int of number of players.
-  GAMESESSIONID/counter - int of current counter (not % 13 though .this is absolute) - mod by 13 will be done by server.
-  GAMESESSIONID/slappedusers - redis hashtable for users who slapped.
-  GAMESESSIONID/turnindex - the index of who is in turn to throw, based on 'users' array (below) (0 to nplayers - 1).
-  GAMESESSIONID/users - redis list of the players (ordered).

for every user USERNAME in GAMESESSIONID, we have:
-  GAMESESSIONID/USERNAME/hand - redis list of the user's hand.


{{{{    methods:    }}}}
State mutations:
-# push to card pile (put card in pile)
-# pop card pile and transfer to loser's hand(identified by loser's username)
-# increment current counter (and get counter result then)
-# register a user's slap (push username to slap hashtable, where key: value = username: slaptime(ms)) - remember that slaptime is determined client-side.
    - simultaneously returns how many users slapped

gets:
-# get current turn
-# get game card pile (in order) ( for testing purposes only)
-# get snapshot of game (everyone's piles)
-# get number of players.
-# get slappedUsers hashtable. (for our gms app)
 */

const self = module.exports = {
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
    initializeGame: (gamesessionid, players, cardsperplayer) => {
        //TODO: do we really need to be strict about card distribution here....

        let snapshotobj = {};
        return new Promise((resolve, reject) => {
            Promise.all(
                players.map((player) => {
                    console.log(`returning promise for ${player}`);
                    return new Promise((resolve, reject) => {
                        Promise.all([
                            redisRpushAsync(`${gamesessionid}/users`, player),
                            Promise.all(
                                Array.from(Array(cardsperplayer)).map((c) => {
                                    console.log(`adding card to ${gamesessionid}/${player}`);
                                    return redisRpushAsync(`${gamesessionid}/${player}/hand`, `${cards.fullcarddeck[Math.floor(Math.random() * cards.fullcarddeck.length)]}`);
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
                    redisSetAsync(`${gamesessionid}/counter`, 0),
                    redisSetAsync(`${gamesessionid}/turnindex`, `${Math.floor(Math.random() * players.length)}`)
                ]
                )).then(() => {
                Promise.all(
                    players.map((player) => {
                        return redisLrangeAsync(`${gamesessionid}/${player}/hand`, 0, cardsperplayer - 1).then((data) => {
                            console.log(`redis lrangeasync ok for ${gamesessionid}/${player}/hand. ${JSON.stringify(data)} `);
                            snapshotobj[player] = data;
                            console.log(`snapshot object : ${JSON.stringify(snapshotobj)}`);
                        });
                    })

                ).then((data) => {
                    resolve(snapshotobj);
                }).catch((e) => {
                    console.log(`REJECT 1`);
                    reject(e)
                })
            }).catch((e) => {
                    console.log(`REJECT 2`);
                    reject(e)
                }
            );
        })
    }


}
//helper stuff
