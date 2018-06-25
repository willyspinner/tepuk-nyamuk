const {Client} = require('pg');
const games = require('./schema/games_table');
const users= require('./schema/users_table');
const fields = require('./schema/fields');
const dbconstants = require ('./schema/dbconstants');
const uuid = require('uuid');
const connectionobject = {
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password:process.env.PG_PASSWORD,
    port : process.env.PG_PORT
};
//NOTE: the db here is dumb. There should be NO VALIDATION LOGIC AT ALL
// HERE.
console.log(`DB connecting to postgres with : ${JSON.stringify(connectionobject)}`);
const client = new Client(
    connectionobject
);
client.connect();
 // self = <- this is for singleton.
const self = module.exports = {
    // POSTGRES implementation
    initTables: ()=>{
        // used to create the table if it doesn't exist.
        return new Promise((resolve,reject)=>{
            const createGames = games.INIT;
            const createUsers = users.INIT;
            client.query(createGames,(err,res)=>{
                if (err)
                    reject(err);
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
        result: {} // JSON.
      }
         */
        return new Promise ((resolve,reject)=>{
            const table_uuid = uuid();
            const queryObj = {
                text:`INSERT INTO ${fields.GAMES.TABLE} VALUES($1,$2,$3,$4,$5,$6,$7)`,
                values: [
                    gameObj.name,
                    `{}`, // players - 0 players.
                    //NOTEDIFF: NO! The creator needs to connect TO!! So he is not a player yet.
                    //NOTEDIFF: as of 19 Jun.
                    table_uuid, // uuid
                    dbconstants.GAMES.STATUS.LOBBY, // status
                    "{}", // result
                    gameObj.createdat, //createdat
                    gameObj.creator // creator
                ]
            };
            console.log(`PG text: ${queryObj.text}`);
            console.log(`PG entering values: ${JSON.stringify(queryObj.values)}`);
            client.query(queryObj,(err,res)=>{
                if(err)
                    reject(err);
                gameObj.uuid= table_uuid;
                gameObj.players= [];//[gameObj.creator]; // NOTEDIFF: HERE IT IS.
                // NOTEDIFF: the above is now []l not [gameObj.creator]
                gameObj.status = dbconstants.GAMES.STATUS.LOBBY;
                gameObj.result={};
                
                console.log(`DB: createGame: returning: ${JSON.stringify(gameObj)}`);

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
                if (err)
                    reject(err);
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
               resolve(res);
            })
        });
    },
    truncateGames: ()=>{
        //WARNING.
        // DELETES ALL ENTRIES IN GAMES.
        return new Promise ((resolve,reject)=>{
            // NOTE: we use the PG_TRUNCATE
            if (process.env.ENVIRON !== 'test' || !process.env.PG_TRUNCATE=== "0")
                reject(new Error("ERROR: Tried to truncate games database. NOT ON TEST ENVIRON"));
            
            console.log(`truncating entire games database... i hope you know what you're doing...`);
            const deletequery = `TRUNCATE TABLE ${fields.GAMES.TABLENAME};`;
            client.query(deletequery,(err,res)=>{
                if(err)
                    reject(err);
                resolve();
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
                        ${fields.GAMES.CREATOR}
                    FROM ${fields.GAMES.TABLENAME}
                    WHERE 
                            ${fields.GAMES.UUID} = $1        
                        ;`,
                values: [gameId]
            };
            client.query(query,(err,res)=>{
                if (err)
                    reject(err);
                if(!res) {
                    console.log(`ERR RES UNDEFINED`);
                    
                    console.log(`query: ${JSON.stringify(query)}`);
                    resolve(undefined);
                }
               
               console.log(`appCS::db::getGame: returning res.rows of length:  ${res.rows.length}`); 
                resolve(res.rows.length ===0? undefined: res.rows[0]);
            })
        });
    },

    registerUser: (userObj) => {
        return new Promise ((resolve,reject)=>{
            const newuserquery = {
                text: `INSERT INTO ${fields.USERS.TABLE} VALUES($1,$2,$3,$4);`,
                values: [userObj.username,null,null,userObj.password]
            };
            
            console.log(`trying to regitser user ${JSON.stringify(userObj)}`);
            client.query(newuserquery,(err,res)=>{
                if(err)
                    reject(err);
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
                if(err)
                    reject(err);
                console.log(`get users res.rows :  ${JSON.stringify(res.rows)}`);
                
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
                if(err)
                    reject(err);
                console.log(`get users res.rows :  ${JSON.stringify(res.rows)}`);

                resolve(res.rows.length === 0? undefined: res.rows[0]);
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
            console.log(`trying to deleting user ${JSON.stringify(deleteuserquery)}`);
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
    }
};