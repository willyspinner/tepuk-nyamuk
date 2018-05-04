module.exports = {
    //note: we can use redis or postgres here.
    createGame: (gameObj) => {
        return new Promise ((resolve,reject)=>{
            //TODO: Link to postgresql
            resolve();
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