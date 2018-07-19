const {Client} = require('pg');
const games = require('./schema/games_table');
const users= require('./schema/users_table');
const fields = require('./schema/fields');
const dbconstants = require ('./schema/dbconstants');
const uuid = require('uuid');
const logger = require('../log/appcs_logger');
const connectionobject = {
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password:process.env.PG_PASSWORD,
    port : process.env.PG_PORT
};
//NOTE: the db here is dumb. There should be NO VALIDATION LOGIC AT ALL
// HERE.
logger.info('db.js: initial connection',`DB connecting to postgres with : ${JSON.stringify(connectionobject)}`);
const client = new Client(
    connectionobject
);
client.connect().then(()=>{
    logger.info('db.js: initial connection',`connection successful`);
}).catch((e)=>{
    logger.error('db.js: initial connection', 'connection ERROR. Is postgresql running?')
    process.exit(1);
});



const self = module.exports = {
    // POSTGRES implementation
    initTables: ()=>{
        // used to create the table if it doesn't exist.
        return new Promise((resolve,reject)=>{
            const createGames = games.INIT;
            const createUsers = users.INIT;
            client.query(createGames,(err,res)=>{
                if (err){
                    reject(err);
                    return;
                }
                client.query(createUsers, (err2,res2) => {
                    if(err2)
                        reject(err2);
                    resolve(res2);
                })
            });
        })
    },
    createGame: (gameObj) => {
         // returns the result from pg.
        // we assume game obj is like the following:
        /*
      {
        name: “my game”,
        createdat: 1023481023, // UNIX TIME
        creator:”creator_USERNAME”,
        players: [
        	“Username1”, “username2”, ….
        ],
        uuid: "12dakxwa", // Lobby ID to join.
        result: {} // JSON.,
        numberOfPlayers: ___
      }
         */
        return new Promise ((resolve,reject)=>{
            const table_uuid = uuid();
            const gameoptions  = {
                numberOfMaxPlayers:gameObj.numberOfMaxPlayers
            }
            const queryObj = {
                text:`INSERT INTO ${fields.GAMES.TABLE} VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
                values: [
                    gameObj.name,
                    `{}`, // players - 0 players.
                    //NOTEDIFF: NO! The creator needs to connect TO!! So he is not a player yet.
                    //NOTEDIFF: as of 19 Jun.
                    table_uuid, // uuid
                    dbconstants.GAMES.STATUS.LOBBY, // status
                    "{}", // result
                    gameObj.createdat, //createdat
                    gameObj.creator, // creator
                    JSON.stringify(gameoptions)
                ]
            };
            //console.log(`PG text: ${queryObj.text}`);
            console.log(`PG entering values: ${JSON.stringify(queryObj.values)}`);
            client.query(queryObj,(err,res)=>{
                if(err)
                {
                    reject(err);
                    return;
                }
                gameObj.uuid= table_uuid;
                gameObj.players= [];//[gameObj.creator]; // NOTEDIFF: HERE IT IS.
                // NOTEDIFF: the above is now []l not [gameObj.creator]
                gameObj.status = dbconstants.GAMES.STATUS.LOBBY;
                gameObj.result={};
                
                logger.info(`DB: createGame:`,`Successful. returning: ${JSON.stringify(gameObj)}`);

                resolve(gameObj);
            })
        });
    },
    queryOpenGames: ()=>{
        return new Promise ((resolve,reject)=> {
            const query = {
                text: `
                SELECT *
                FROM ${fields.GAMES.TABLENAME}
                WHERE 
                    ${fields.GAMES.STATUS} = '${dbconstants.GAMES.STATUS.LOBBY}'
                    ;`
            };
            console.log(`query open games doing : ${JSON.stringify(query)}`);
            client.query(query,(err,res)=>{
                if (err){
                
                console.log(`opengames query rejected..`);
                    reject(err);
                }
                console.log(`opengames query resolved..`);
                resolve(res.rows);
            })
        })
    },
    queryAllGames: ()=>{
        return new Promise ((resolve,reject)=> {
            const query = {
                text: `
                SELECT *
                FROM ${fields.GAMES.TABLENAME}
                    ;`
            };
            console.log(`query open games doing : ${JSON.stringify(query)}`);
            client.query(query,(err,res)=>{
                if (err){
                    reject(err);
                    return;
                }
                resolve(res.rows);
            })
        })
    },
    deleteGame: (gameId)=>{
        return new Promise ((resolve,reject)=>{
            const deletequery = {
                text: `DELETE FROM ${fields.GAMES.TABLENAME} `+
                    `WHERE ${fields.GAMES.UUID} = $1`,
                values:[gameId]
            };
            client.query(deletequery,(err,res)=>{
                if(err)
                    reject(err);
                else
                   resolve(res);
            })
        });
    },
    getGame: (gameId)=>{
        return new Promise ((resolve,reject)=>{
            const query = {
                text: `
                    SELECT 
                        ${fields.GAMES.NAME},
                        ${fields.GAMES.PLAYERS},
                        ${fields.GAMES.UUID},
                        ${fields.GAMES.STATUS},
                        ${fields.GAMES.RESULT},
                        ${fields.GAMES.CREATEDAT},
                        ${fields.GAMES.CREATOR},
                        ${fields.GAMES.GAMEOPTIONS}
                    FROM ${fields.GAMES.TABLENAME}
                    WHERE 
                            ${fields.GAMES.UUID} = $1        
                        ;`,
                values: [gameId]
            };
            client.query(query,(err,res)=>{
                if (err){
                    logger.warn("db::getGame(gameId)","rejecting promise...")
                    reject(err);
                    return;
                }
                if(!res) {
                    console.log(`ERR RES UNDEFINED`);
                    
                    console.log(`query: ${JSON.stringify(query)}`);
                    reject(undefined);
                    return;
                }
               // Minor fix here to prevent crashes.
                resolve(!res.rows || res.rows.length ===0? undefined: res.rows[0]);
            })
        });
    },

    registerUser: (userObj) => {
        return new Promise ((resolve,reject)=>{
            const newuserquery = {
                text: `INSERT INTO ${fields.USERS.TABLE} VALUES($1,$2,$3,$4);`,
                values: [userObj.username,null,null,userObj.password]
            };
            
            logger.info(`db::registerUser()`,`trying to register user ${JSON.stringify(userObj)}`);
            client.query(newuserquery,(err,res)=>{
                if(err){
                    reject(err);
                    return;
                }
                resolve(res);
            })
        })
    },
    getUser:(username)=>{
        return new Promise ((resolve,reject)=>{
            const getuserquery = {
                text:
                    `SELECT ${fields.USERS.USERNAME},${fields.USERS.GAMEID},  ${fields.USERS.SOCKET_ID} `+
                    `FROM ${fields.USERS.TABLENAME} `+
                    ` WHERE ${fields.USERS.USERNAME} = $1 ;`,
                values: [username]
            };
            client.query(getuserquery,(err,res)=>{
                if(err){
                    reject(err);
                    return;
                }
                logger.info('db.js::getUser()',`get users res.rows :  ${JSON.stringify(res.rows)}`);
                
                resolve(res.rows.length === 0? undefined: res.rows[0]);
            })
        })
    },
    loginUserSocketId: (username,socketid)=>{
        return new Promise((resolve,reject)=>{
            const updatesocketuserquery = {
                    text: `UPDATE ${fields.USERS.TABLENAME} `+
                        `SET ${fields.USERS.SOCKET_ID} = $1 `+
                        ` WHERE ${fields.USERS.USERNAME} = $2;`,
                    values: [socketid ,username]
                } ;
            client.query(updatesocketuserquery,(err, res )=>{
                if(err){
                    reject(err);
                    return;
                }
                resolve();
            });
        })
    },
    // NOTE: below is only for authenticated purposes only, as it exposes
    // the socket id token.
    getUserSecrets: (username)=>{
        return new Promise ((resolve,reject)=>{
            const getuserfullquery = {
                text: `SELECT * FROM ${fields.USERS.TABLENAME} WHERE ${fields.USERS.USERNAME} = $1 ;`,
                values: [username]
            };
            client.query(getuserfullquery,(err,res)=>{
                if(err){
                    logger.error("db::getUserSecrets",`rejecting getUserSecrets..... reject error :${JSON.stringify(err)}`)
                    reject(err);
                    return;
                }
                logger.info('db.js::getUserSecrets()',`get users res.rows :  ${JSON.stringify(res.rows)}`);

                const toberes = !res.rows || res.rows.length ===0 ? undefined: res.rows[0];
                logger.info("db.js::getUserSecrets()",`resolving with : ${JSON.stringify(toberes)}`)
                resolve(toberes);
               // resolve(!res.rows || res.rows.length === 0? undefined: res.rows[0]);
            })
        })
    },
    deleteUser: (username) => {
        return new Promise ((resolve,reject)=>{
            const deleteuserquery = {
                text: `DELETE FROM ${fields.USERS.TABLENAME} WHERE `
              +`${fields.USERS.USERNAME} = $1;`,
                values: [username]
            };
            logger.info(`db.js::deleteUser()`,`trying to deleting user ${JSON.stringify(deleteuserquery)}`);
            client.query(deleteuserquery,(err,res)=>{
                if(err){
                    reject(err);
                    return;
                }
                resolve(res);
            })

        })
    },
    joinGame: (username,gameId)=>{
        return new Promise ((resolve,reject)=>{
            const shouldAbort = (err) => {
                if (err) {
                    console.error('Error in transaction', err.stack);
                    client.query('ROLLBACK', (err) => {
                        if (err) {
                            console.error('Error rolling back client', err.stack)
                        }
                        reject();
                        return;
                    })
                }
                return !!err;
            };
            client.query('BEGIN', (err) => {
                if (shouldAbort(err)){
                    reject(err);
                    return;
                }
                const updateGamesTableQuery = {
                    text: `UPDATE ${fields.GAMES.TABLENAME} `+
                    `SET ${fields.GAMES.PLAYERS} = array_append(${fields.GAMES.PLAYERS}, $1) `+
                    `WHERE ${fields.GAMES.UUID} = $2;`,
                    values: [username, gameId]
                };
                client.query(updateGamesTableQuery, (err, res) => {
                    if (shouldAbort(err)){
                        reject(err);
                        return;
                    }
                    const updateUsersTableQuery = {
                        text: `UPDATE ${fields.USERS.TABLENAME} `+
                        `SET ${fields.USERS.GAMEID} = $1 `+
                        `WHERE ${fields.USERS.USERNAME} = $2`,
                        values: [gameId,username]
                    };
                    client.query(updateUsersTableQuery, (err, res) => {
                        if (shouldAbort(err)){
                            reject(err);
                            return;
                        }

                        client.query('COMMIT', (err) => {
                            if (err) {
                                console.error('Error committing transaction', err.stack);
                                reject(err);
                                return;
                            }
                            resolve();
                        })
                    })
                })
            })
        });
    },

    leaveGame: (userObj)=>{
        return new Promise ((resolve,reject)=>{
            const shouldAbort = (err) => {
                if (err) {
                    console.error('Error in transaction', err.stack);
                    client.query('ROLLBACK', (err) => {
                        if (err) {
                            console.error('Error rolling back client', err.stack)
                        }
                        // release the client back to the pool
                        reject();
                    })
                }
                return !!err;
            };
            client.query('BEGIN', (err) => {
                if (shouldAbort(err)){
                    reject(err);
                    return;
                }
                const updateGamesTableQuery = {
                    text: `UPDATE ${fields.GAMES.TABLENAME} `+
                    `SET ${fields.GAMES.PLAYERS} = array_remove(${fields.GAMES.PLAYERS}, $1) `+
                    `WHERE ${fields.GAMES.UUID} = $2;`,
                    values: [userObj.username, userObj.gameid]
                } ;
                client.query(updateGamesTableQuery, (err, res) => {
                    if (shouldAbort(err)){
                        reject(err);
                        return;
                    }
                    const updateUsersTableQuery = {
                        text: `UPDATE ${fields.USERS.TABLENAME} `+
                        `SET ${fields.USERS.GAMEID} = $1 `+
                        `WHERE ${fields.USERS.USERNAME} = $2`,
                        values: [null,userObj.username]
                    };
                    client.query(updateUsersTableQuery, (err, res) => {
                        if (shouldAbort(err)){
                            reject(err);
                            return;
                        }
                        client.query('COMMIT', (err) => {
                            if (err) {
                                console.error('Error committing transaction', err.stack);
                                reject(err);
                                return;
                            }
                            resolve();
                        })
                    })
                })
            })
        });
    },
    startGame: (gameid)=> {
        return new Promise ((resolve,reject)=>{
            const startgamequery = {
                text: `UPDATE ${fields.GAMES.TABLENAME} `+
                    `SET ${fields.GAMES.STATUS} `+
                `= '${dbconstants.GAMES.STATUS.INPROGRESS}' `+
                    `WHERE ${fields.GAMES.UUID} = $1;`,
               values: [gameid]
            };
           client.query(startgamequery,(err,res)=>{
             if(err){
                 reject(err);
                 return;

             }
             resolve();
           })
        });
    },
    //TODO: get history of all played games by this user.
    getGamesHistory : (username)=>{

    },
    // Called by GMS when a game finishes.
    gmsFinishGame : (gameid,resultObj)=>{
        return new Promise ((resolve,reject)=>{
            const shouldAbort = (err) => {
                if (err) {
                    console.error('Error in transaction', err.stack);
                    client.query('ROLLBACK', (err) => {
                        if (err) {
                            console.error('Error rolling back client', err.stack)
                        }
                        reject();
                        return;
                    })
                }
                return !!err;
            };
            client.query('BEGIN', (err) => {
                if (shouldAbort(err)){
                    reject(err);
                    return;
                }
                const finishgamequery = {
                    text: `UPDATE ${fields.GAMES.TABLENAME} `+
                    `SET ${fields.GAMES.STATUS} `+
                    `= '${dbconstants.GAMES.STATUS.ENDED}',${fields.GAMES.RESULT} = $2 `+
                    `WHERE ${fields.GAMES.UUID} = $1;
              `,
                    values: [gameid,JSON.stringify(resultObj)]
                };
                const finishgameusersquery= {
                    text: `UPDATE ${fields.USERS.TABLENAME}
                        SET ${fields.USERS.GAMEID} = null
                WHERE ${fields.USERS.GAMEID} = $1;`,
                    values: [gameid]
                }
                client.query(finishgamequery, (err, res) => {
                    if (shouldAbort(err)){
                        reject(err);
                        return;
                    }
                    client.query(finishgameusersquery, (err, res) => {
                        if (shouldAbort(err)){
                            reject(err);
                            return;
                        }

                        client.query('COMMIT', (err) => {
                            if (err) {
                                console.error('Error committing transaction', err.stack);
                                reject(err);
                                return;
                            }
                            resolve();
                        })
                    })
                })
            })
        });
    },
    // called by GMS when someone leaves in a game (midway).
    gmsInterruptOngoingGame:  (gameid)=>{

    }
};