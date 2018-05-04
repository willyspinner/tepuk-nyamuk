const {Client} = require('pg');
const games = require('./schema/games_table');
const users= require('./schema/users_table');
const fields = require('./schema/fields');
const dbconstants = require ('./schema/dbconstants');
const uuid = require('uuid');
const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password:process.env.PG_PASSWORD,
    port : process.env.PORT
})
client.connect();

module.exports = {
    // POSTGRES implementation
    initTables: ()=>{
        // used to create the table if it doesn't exist.
        return new Promise((resolve,reject)=>{
            const createGames = games.INIT;
            const createUsers = users.INIT;
            client.query(createGames,(err,res)=>{
                if (err)
                    reject(err);
                client.query(createUsers,(err2,res2)=>{
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
        gameLobbyId: "12dakxwa" // Lobby ID to join.
      }
         */
        return new Promise ((resolve,reject)=>{
            //TODO: validation.
            const table_uuid = uuid()
            const queryObj = {
                text:`INSERT INTO ${fields.GAMES.TABLE} VALUES($1,$2,$3,$4,$5,$6,$7)`,
                values: [
                    gameObj.name,
                    `{"${gameObj.creator}"}`, // players - the creator is now a player.
                    table_uuid, // uuid
                    dbconstants.GAMES.STATUS.LOBBY, // status
                    "{}", // result
                    gameObj.createdat, //createdat
                    gameObj.creator // creator
                ]
            }
            console.log(`PG text: ${queryObj.text}`);
            console.log(`PG entering values: ${JSON.stringify(queryObj.values)}`);
            client.query(queryObj,(err,res)=>{
                if(err)
                    reject(err);
                gameObj.uuid= table_uuid;
                gameObj.players= [gameObj.creator];
                gameObj.status = dbconstants.GAMES.STATUS.LOBBY;

                resolve(gameObj);
            })
        });
    },
    queryOpenGames: ()=>{
        return new Promise ((resolve,reject)=> {
            const query = {
                text: `
                SELECT 
                    ${fields.GAMES.PLAYERS},
                    ${fields.GAMES.UUID},
                    ${fields.GAMES.STATUS},
                    ${fields.GAMES.RESULT},
                    ${fields.GAMES.CREATEDAT},
                    ${fields.GAMES.CREATOR}
                FROM ${fields.GAMES.TABLENAME}
                WHERE 
                    ${fields.GAMES.STATUS} = ${dbconstants.GAMES.STATUS.LOBBY}
                    ;`
            }
            client.query(query,(err,res)=>{
                if (err)
                    reject(err);
                resolve(res.rows);
            })
        })
    },
    deleteGame: (gameId)=>{
        return new Promise ((resolve,reject)=>{
            //TODO: Link to postgresql
            resolve();
        });
    },
    dropTables: ()=>{
        //WARNING.
        //METHOD FOR TESTING PURPOSES ONLY
        // DELETES ALL ENTRIES IN Tables, and players.
        //TODO :link to postgres
        return new Promise ((resolve,reject)=>{
            //TODO: Link to postgresql
            resolve();
        });
    },
    getGame: (gameId)=>{
        return new Promise ((resolve,reject)=>{
            const query = {
                text: `
                    SELECT 
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
            }
            client.query(query,(err,res)=>{
                if (err)
                    reject(err);

                resolve(res.rows.length ==0? undefined: res.rows[0]);
            })
        });
    },


    joinGame: (userObj,gameId)=>{
        return new Promise ((resolve,reject)=>{
            //TODO: Link to postgresql
            // TODO: checks if the game is full.
            resolve();
        });
    },

    leaveGame: (userObj)=>{
        return new Promise ((resolve,reject)=>{
            //TODO: Link to postgresql
            resolve();
        });
    },
    startGame: (gameId)=> {
        return new Promise ((resolve,reject)=>{
            //TODO: Link to postgresql
            resolve();
        });
    }
}