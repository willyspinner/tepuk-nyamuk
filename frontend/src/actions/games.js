import request from 'request';
import moment from 'moment';
import mysocket from '../socket/socketclient';
import {GETOPENGAMES,CREATEGAME,DELETEGAME,STARTGAMEFROMLOBBY} from "../serverroutes/AppCSRoutes";
export const gamesEmptyReduxState = ()=>({
    type: "EMPTY_GAME_STATE"
});

export const addGame = ( game )=> ({
  type: 'ADD_GAME',
    game:{
        ...game,
        players: game.players? game.players: []
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
                        reject(`couldn't get open games. resobj err: ${resobj.error}`);
                        return;
                    }
                    resobj.games.forEach((game)=>reduxDispatch(addGame(game)));
                    resolve();
                })
        });
    }
};
//NOTE: creating and adding a game(from server) uses the same local redux action.
// (ADD_GAME)
export const startCreateGame = (gameObj) => {
    return (reduxDispatch, getState) =>{
        return new Promise((resolve,reject)=>{
        gameObj.createdat = moment.now();
        gameObj.creator = getState().user.username;
            request.post(CREATEGAME(gameObj ,getState().user.token),
                (err,res,body)=>{
                    if(err){
                        reject({error:"couldn't connect to server"});
                        return;
                    }
                    resolve(JSON.parse(body));
                })
        });
    }
    ;
};


export const removeGame = (uuid) => { // ID MUST BE FILLED. NO DEFAULTS
    return {
        'type': 'REMOVE_GAME',
        uuid
    }

};

export const startRemoveGame = (gameid) => {
    return (reduxDispatch,getState) => {
        return new Promise((resolve,reject)=>{
            request.delete(
                DELETEGAME(gameid,getState().user.token, getState().user.socketid)
                ,
                (err,res,body)=>{
                    console.log(`body : ${body}`);
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

export const joinGame = (gameuuid,username) => ({
    type :'JOIN_GAME',
    uuid:gameuuid,
    username,
});

export const startJoinGame = (uuid,username,onGameStart,onGameDeleted,onKickedOut) => {
    //returns a JS promise when game join is approved by server.
    return (reduxDispatch,getState) => {
    return new Promise((resolve,reject)=>{
        console.log(`games_action:: startJoinGame: trying to subscribe to lobby ${uuid}...`);
        const onUserJoin = (other_user)=>{
          /* onUserJoin  (when someone joins.*/
            console.log(`${other_user} joined.`);
            reduxDispatch(joinGame(uuid,other_user));

        };
          const onUserLeft=  (other_user)=>{
                /* onUserLeft - (when someone leaves).*/
                console.log(`${other_user} left .`);
                reduxDispatch(leaveGame(uuid,other_user));
            };


                mysocket.subscribeToLobby(username,uuid,
                    onUserJoin,onUserLeft,onGameStart,onGameDeleted,onKickedOut).then((playersInLobby)=>{
                    reduxDispatch(joinGame(uuid,username));
                    resolve(playersInLobby);
                }).catch((e)=>{
                    console.log(`failed to subscribe to lobby ${uuid}`);
                    reject(e);
                });

        setTimeout(()=>{
            reject();
        },10000);
            });
    }
    };
export const leaveGame = (uuid,username)=>({
    type:'LEAVE_GAME',
        uuid,
        username
});
export const startLeaveGame = (uuid,username) => {
    //returns a JS promise when game join is approved by server.
    return (reduxDispatch,getState) => {
        return new Promise((resolve,reject)=>{
            const onSuccessLeave = ()=>{
                console.log(`frontend::action/games::startLeaveGame: dispatching leave game... from start leave game`);
                reduxDispatch(leaveGame(uuid,username));
                resolve();
            };
            const onFailLeave = ()=>{
                reject();
            };


            mysocket.unsubscribeFromLobby({username: username, gameid: uuid},
                onSuccessLeave,
                onFailLeave);
        });


    }
};
//NOTEDIFF: this is used to signal to main lobby people that a game has started
// and is unavailable to be joined.
export const startedGame = (uuid)=>{
    return {
        type: 'STARTED_GAME',
        uuid
    }
}

export const startKickoutUser = (username,gameid)=>{
    return (reduxDispatch,getState)=>{
        /* returns a promise. */
            return mysocket.kickoutUser(username,gameid)
    };
};
export const startStartGame = (gameid) => {
    return (reduxDispatch,getState)=>{
        return new Promise((resolve,reject)=>{
           request.post(
               STARTGAMEFROMLOBBY(gameid,getState().user.token,getState().user.socketid,
                   (err,res,body)=>{
                        const response = JSON.stringify(body);

                        console.log(`error obj :`,err);
                        if(err){
                            reject(err);
                            return;
                        }
                       alert(`start game from lobby result : ${response}`);
                        if(response.success)
                            resolve(response);
                        else
                            reject(response);
                   })
           )
        });
    }
}