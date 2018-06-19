import request from 'request';
import moment from 'moment';
import mysocket from '../socket/socketclient';
import {GETOPENGAMES,CREATEGAME,DELETEGAME} from "../serverroutes/AppCSRoutes";
export const gamesEmptyReduxState = ()=>({
    type: "EMPTY_GAME_STATE"
})

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
                DELETEGAME(gameid,getState().user.token, getState().user.socketid)
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

export const joinGame = (gameuuid,username) => ({
    type :'JOIN_GAME',
    uuid:gameuuid,
    username,
})

export const startJoinGame = (uuid,username) => {
    //returns a JS promise when game join is approved by server.
    return (reduxDispatch,getState) => {
    return new Promise((resolve,reject)=>{
        console.log(`games_action:: startJoinGame: trying to subscribe to lobby ${uuid}...`);
        const onUserJoin = (other_user)=>{
          /* onUserJoin  (when someone joins.*/
            console.log(`${other_user} joined.`);
                /* TODO @ 19 Jun 2018: Dispatch a redux action showing that
                                someone Joined here. (to update our feed)
                 */
                //TODO @ 19 Jun 2018: is it this:
            reduxDispatch(joinGame(uuid,other_user));

        };
          const onUserLeft=  (other_user)=>{
                /* onUserLeft - (when someone leaves).*/
                console.log(`${other_user} left .`);
                /* TODO @ 19 Jun 2018: Dispatch a redux action showing that
                                someone left here.
                 */
                //TODO @ 19 Jun 2018: is it this:
                reduxDispatch(leaveGame(uuid,other_user));
            };

                mysocket.subscribeToLobby(username,uuid,
                    onUserJoin,onUserLeft).then((playersInLobby)=>{
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
    }
export const leaveGame = (uuid,username)=>({
    type:'LEAVE_GAME',
        uuid,
        username
});
export const startLeaveGame = (uuid,username) => {
    //returns a JS promise when game join is approved by server.
    return (reduxDispatch,getState) => {
        //TODO:
        console.log(`dispatching leave game... from start leave game`);
        reduxDispatch(leaveGame(uuid,username));
        return new Promise((resolve,reject)=>{
            setTimeout(()=>{
                resolve();
            },1000);

        })


    }
}
