import request from 'request';
import moment from 'moment';
import {GETOPENGAMES,CREATEGAME,DELETEGAME} from "../serverroutes/AppCSRoutes";
export const gamesEmptyReduxState = ()=>({
    type: "EMPTY_GAME_STATE"
})

export const addGame = ( game )=> ({
  type: 'ADD_GAME',
    game:{
        ...game,
        players: game.players? game.players: [game.creator]
    }
});
export const startGetOpenGames = ()=>{
    return (reduxDispatch) =>{
        return new Promise((resolve,reject)=>{

            console.log(`actions/games::startGetOpenGames: GETOPENGAMES.. ${JSON.stringify(GETOPENGAMES())}`);
            request.get(GETOPENGAMES(),
                (err,res,body)=>{
                console.log(`actions/games::startGetOpenGames: body obj is : ${body}`);
                    const resobj = JSON.parse(body);
                    if(!resobj.success){
                        reject(`couldn't get open games. resobj err: ${resobj.error}`)
                        return;
                    }
                    resobj.games.forEach((game)=>reduxDispatch(addGame(game)));
                    resolve();
                })
        });
    }
}
//NOTE: creating and adding a game(from server) uses the same local redux action.
// (ADD_GAME)
export const startCreateGame = (gameObj) => {
    return (reduxDispatch, getState) =>{
    //TODO: actual creating a  game:
        return new Promise((resolve,reject)=>{
        gameObj.createdat = moment.now();
        gameObj.creator = getState().user.username;
            request.post(CREATEGAME(gameObj ,getState().user.token),
                (err,res,body)=>{
                    if(err){
                        reject({error:"couldn't connect to server"})
                        return;
                    }
                    resolve(JSON.parse(body));
                })
        });
    }
    ;
}


export const removeGame = (uuid) => { // ID MUST BE FILLED. NO DEFAULTS
    return {
        'type': 'REMOVE_GAME',
        uuid
    }

}

export const startRemoveGame = (gameid) => {
    return (reduxDispatch,getState) => {
        return new Promise((resolve,reject)=>{
            request.delete(
                DELETEGAME(gameid,getState().user.token,getState().user.socketid)
                ,
                (err,res,body)=>{
                    const resobj = JSON.parse(body);
                    if(resobj.success)
                        resolve("ok");
                    else
                        reject("deletion of game unsuccessful..");
                }
            )
        });
    };

};

export const joinGame = (uuid,username) => ({
    type :'JOIN_GAME',
    uuid,
    username,
})

// used when the leader initially joins the game. just a simple local redux action
export const startJoinGame = (uuid,username) => {
    //returns a JS promise when game join is approved by server.
    return (reduxDispatch,getState) => {
        //TODO: send an axios POST to join
        //TODO: dispatch to alter gameid redux state.
    return new Promise((resolve,reject)=>{
        reduxDispatch(joinGame(uuid,username));
        setTimeout(()=>{
            resolve();
        },1000);

    })


    }
}
export const leaveGame = (uuid,username)=>({
    type:'LEAVE_GAME',
        uuid,
        username
});
export const startLeaveGame = (uuid,username) => {
    //returns a JS promise when game join is approved by server.
    return (reduxDispatch,getState) => {
        //TODO: send an axios POST to leave. DO THIS!
        console.log(`dispatching leave game... from start leave game`);
        reduxDispatch(leaveGame(uuid,username));
        return new Promise((resolve,reject)=>{
            setTimeout(()=>{
                resolve();
            },1000);

        })


    }
}
