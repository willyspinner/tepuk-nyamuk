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
            resolve();
        })
    },
    deleteGame: (gameId)=>{
        return new Promise ((resolve,reject)=>{
            //TODO: Link to postgresql
            resolve();
        });
    },
    getGame: (gameId)=>{
        return new Promise ((resolve,reject)=>{
            //TODO: Link to postgresql
            resolve();
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