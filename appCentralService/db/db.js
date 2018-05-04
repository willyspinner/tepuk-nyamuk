const {Client} = require('pg');
const games = require('./schema/games_table');
const users= require('./schema/users_table');
const fields = require('./schema/fields');
const dbconstants = require ('./dbconstants');
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
        // we assume game obj is like the following:
        /*
      {
        name: “my game”,
        createdAt: 1023481023, // UNIX TIME
        creator:”creator_USERNAME”,
        players: [
        	“Username1”, “username2”, ….
        ],
        gameLobbyId: "12dakxwa" // Lobby ID to join.
      }
         */
        return new Promise ((resolve,reject)=>{
            //TODO: Link to postgresql
            //TODO: validation.
            const queryObj = {
                text:`INSERT INTO ${fields.GAMES.TABLE} VALUES($1,$2,$3,$4,$5,$6)`,
                values: [
                    gameObj.creator, // players - the creator is now a player.
                    uuid(), // uuid
                    dbconstants.GAMES.STATUS.LOBBY, // status
                    "{}", // result
                    gameObj.createdAt, //createdAt
                   gameObj.creator // creator
                ]
            }
            client.query(queryObj,(err,res)=>{
                if(err)
                    reject(err);
                resolve(res);
            })
        });
    },
    queryOpenGames: ()=>{
        return new Promise ((resolve,reject)=> {
            //TODO: link to postgresql
            //TODO: remember not to get creator's socket id.
            const games = {};
            resolve(games);
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
            //TODO: Link to postgresql
            let game = {};
            resolve(game);
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