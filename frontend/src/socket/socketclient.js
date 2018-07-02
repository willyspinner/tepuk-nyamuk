/* Singleton class for our socket client HOC. This singleton is made so that
 * the socket code is abstracted away from us. */
import EVENTS from '../../../appCentralService/constants/socketEvents';
import GMSEVENTS from '../../../gameMarshallingService/constants/socketEvents';
const ioclient = require('socket.io-client');
class SocketClient {
    mysocket=null;
    connect(connectionStr, token,extraquery){
        this.token = token;
        let thatsocket = this.mysocket;
        return new Promise((resolve,reject)=>{
            console.log(`in connect method of SocketClient... trying to connect socket ;..`);
            console.log(`connectionStr: ${connectionStr}`);
            console.log(`socket connecting with token : ${token}`);

            thatsocket =  ioclient(`${connectionStr}`,{
                    query: {
                        token:token,
                        ...extraquery
                    }
                }
            );

            console.log(`trying to listen to connect event.`);
            this.mysocket = thatsocket;
            thatsocket.on('connect',()=>{
                console.log(`socket connected and authenticated`);

                console.log(`got id: ${thatsocket.id}`);
                resolve(thatsocket.id);
            });
            //NOTEDIFF: setTimeout is placed here
            //setTimeout(()=>{reject("time out . more than 6000 ms")},6000);
        });
    }

    subscribeToMainPage(onGameCreate,onGameDelete,onRecvChat,onGameStarted){
        this.mysocket.on(EVENTS.GAME_CREATED,(data)=>onGameCreate(data.game));
        this.mysocket.on(EVENTS.GAME_DELETED,(data)=> onGameDelete(data.gameuuid));
        this.mysocket.on(EVENTS.RECV_CHAT_MSG,(data)=>onRecvChat(data) )
        this.mysocket.on(EVENTS.GAME_STARTED,(data)=>onGameStarted(data) )
    }
    sendChatMessage(msgObj){
        //NOTE: this isn't promise based, since we'll be waiting for the broadcast
        // from the ws server for our chat sent.
            this.mysocket.emit(EVENTS.EMIT_CHAT_MSG,msgObj);
    }
    unsubscribeFromMainPage(){
        this.mysocket.removeAllListeners(EVENTS.GAME_CREATED);
        this.mysocket.removeAllListeners(EVENTS.GAME_DELETED);
        this.mysocket.removeAllListeners(EVENTS.RECV_CHAT_MSG);

    }
    subscribeToLobby(username,gameid,onUserJoin,onUserLeave,onLobbyGameStart,onLobbyGameDeleted){
        return new Promise((resolve,reject)=>{
            this.mysocket.emit(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN,{username,gameid, token : this.token},
                (ackResponse)=>{
                    if(ackResponse.msg === EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_ACK){
                        this.mysocket.on(EVENTS.LOBBY.USER_JOINED,(username)=>{
                            onUserJoin(username);
                        });
                        this.mysocket.on(EVENTS.LOBBY.USER_LEFT,(username)=>{
                            onUserLeave(username);
                        });
                        this.mysocket.on(EVENTS.LOBBY.LOBBY_GAME_DELETED,()=>{
                            onLobbyGameDeleted(gameid);
                        });
                        this.mysocket.on(EVENTS.LOBBY.GAME_START,(gameStartObj)=>{
                            this.mysocket.close();
                            onLobbyGameStart(gameStartObj);
                        });
                        resolve(ackResponse.players);
                    }else{
                        reject();
                        //No ack.
                    }
                });
        });
    }
    subscribeToGameplay (gameStartObj,username,onPlayerSlapRegistered,onNextTick,onMatchResult,onGameStart){
        return new Promise((resolve,reject)=>{
            this.connect(`http://${process.env.GMS_HOST}:${process.env.GMS_PORT}`,gameStartObj.gametoken,
                {gamesecret: gameStartObj.gamesecret, username: username}
            ).then(()=> {
                this.mysocket.on(GMSEVENTS.PLAYER_SLAP_REGISTERED, (data) => {
                    onPlayerSlapRegistered(data);
                })
                this.mysocket.on(GMSEVENTS.NEXT_TICK, (data) => {
                    onNextTick(data);
                });
                this.mysocket.on(GMSEVENTS.MATCH_RESULT,(data)=>{
                    onMatchResult(data);
                })
                this.mysocket.on(GMSEVENTS.GAME_START,(data)=>{
                    onGameStart(data);
                })
                resolve();
            }).catch((e)=>reject(e));
        });

    }
    throwCard(){
        return new Promise((resolve,reject)=>{
            this.mysocket.emit(GMSEVENTS.PLAYER_THREW,{},(response)=>{
                if(response.success)
                resolve(response);
                else
                    reject(response);

            });
        });
    }
    slap(reactiontime){
        return new Promise((resolve,reject)=>{
            this.mysocket.emit(GMSEVENTS.PLAYER_SLAPPED,{reactiontime:reactiontime},(res)=>{
                if(res.success)
                    resolve(res);
                else
                    reject(res);
            });
        });
    }

    unsubscribeFromLobby(userStateObj,onSuccessLeave,onfailLeave){
        this.mysocket.emit(EVENTS.LOBBY.CLIENT_LEAVE,userStateObj,(ack)=>{
            if(ack === EVENTS.LOBBY.CLIENT_LEAVE_ACK){
                this.mysocket.removeAllListeners(EVENTS.LOBBY.GAME_START);
                this.mysocket.removeAllListeners(EVENTS.LOBBY.LOBBY_GAME_DELETED);
                this.mysocket.removeAllListeners(EVENTS.LOBBY.USER_JOINED);
                this.mysocket.removeAllListeners(EVENTS.LOBBY.USER_LEFT);
                onSuccessLeave();
            }else{
                onfailLeave();
            }
        })
    }


    close(){
        if(this.mysocket)
            this.mysocket.close();
    }
}

const instance = new SocketClient();
//Object.freeze(instance);
//NOTEDIFF: we don't use object.freeze here since in this way,
//NOTEDIFF: we cannot manipulate the object once it leaves this blueprint and becomes our singleton.
export default instance;
//export default SocketClient;
