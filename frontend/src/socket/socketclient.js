/* Singleton class for our socket client HOC. This singleton is made so that
 * the socket code is abstracted away from us. */
import EVENTS from '../../../appCentralService/constants/socketEvents';
import GMSEVENTS from '../../../gameMarshallingService/constants/socketEvents';
const ioclient = require('socket.io-client');
class SocketClient {
    mysocket=null;
    connect(connectionStr, token,extraquery,type, onRecvNotif){
        this.token = token;
        let thatsocket = this.mysocket;

        return new Promise((resolve,reject)=>{
            console.log(`in connect method of SocketClient... trying to connect socket ;..`);
            console.log(`connectionStr: ${connectionStr}`);
            console.log(`socket connecting with token : ${token}`);
            console.log(` TYPE: ${type}, desired?? ${'gms' === type || 'appcs' === type}`)
            if (!( type === 'gms' || type === 'appcs')){
                console.log(`REJECTING. TYPE: ${type}, wanted: gms. Equal? ${'gms' === type}`)
                reject({error:'invalid type for connection!'})
                return;
            }
            thatsocket =  ioclient(`${connectionStr}`,{
                path:`/${type}-socketio`, //NOTE: this is the endpoint that we declared for appcs socket io messages. our io server listens for this.
                    query: {
                        token:token,
                        ...extraquery
                    }
                }
            );

            this.mysocket = thatsocket;
            thatsocket.on('connect',()=>{
                console.log(`socket connected and authenticated`);

                console.log(`got id: ${thatsocket.id}`);
                resolve(thatsocket.id);
            });
            thatsocket.on('disconnect',()=>{
                console.log('RIPP GOT DISCONNECTED SOCKET! oh noes..');
            })
            //NOTEDIFF: setTimeout is placed here
            //setTimeout(()=>{reject("time out . more than 6000 ms")},6000);
        });
    }

    subscribeToMainPage(onGameCreate,onGameDelete,onRecvChat,onGameStarted,onRecvInvitation,onRecvNotif){
        this.mysocket.on(EVENTS.GAME_CREATED,(data)=>onGameCreate(data.game));
        this.mysocket.on(EVENTS.GAME_DELETED,(data)=> onGameDelete(data.gameuuid));
        this.mysocket.on(EVENTS.RECV_CHAT_MSG,(data)=>onRecvChat(data) )
        this.mysocket.on(EVENTS.GAME_STARTED,(data)=>onGameStarted(data) )
        this.mysocket.on(EVENTS.LOBBY.LOBBY_INVITATION,(data)=>onRecvInvitation(data) )
        this.mysocket.on(EVENTS.RECV_NOTIF,(data)=> {
            console.log(`socketclient::subscribeToMainPage: received data: ${data}`);
            onRecvNotif(data);
        });
        this.mysocket.emit(EVENTS.GET_NOTIF);
    }
    sendChatMessage(msgObj){
        //NOTE: this isn't promise based, since we'll be waiting for the broadcast
        // from the ws server for our chat sent.
            this.mysocket.emit(EVENTS.EMIT_CHAT_MSG,msgObj);
    }
    inviteToLobby(myusername,gameid,gamename, inviteeUsername,onSuccess,onFail){

        this.mysocket.emit(EVENTS.LOBBY.INVITE_USER,{
            gameid,
            gamename,
            invitee:inviteeUsername,
            invitedBy: myusername
        },(ack)=>{
            if(ack === EVENTS.LOBBY.INVITE_USER_SUCCESS){
                onSuccess();
            }else{
                onFail(ack);
            }

        });
    }
    unsubscribeFromMainPage(){
        if(this.mysocket){
        this.mysocket.removeAllListeners(EVENTS.GAME_CREATED);
        this.mysocket.removeAllListeners(EVENTS.GAME_DELETED);
        this.mysocket.removeAllListeners(EVENTS.GAME_STARTED);
        this.mysocket.removeAllListeners(EVENTS.LOBBY.LOBBY_INVITATION);
        this.mysocket.removeAllListeners(EVENTS.RECV_CHAT_MSG);
        this.mysocket.removeAllListeners(EVENTS.RECV_NOTIF);
        }
   }
    subscribeToLobby(username,gameid,onUserJoin,onUserLeave,onLobbyGameStart,onLobbyGameDeleted,onKickedOut){
        return new Promise((resolve,reject)=>{
            this.mysocket.emit(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN,{username,gameid, token : this.token},
                (ackResponse)=>{
                    if(ackResponse.msg === EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_ACK){
                        this.mysocket.on(EVENTS.LOBBY.USER_JOINED,(userAndLevel)=>{
                            onUserJoin(userAndLevel);
                        });
                        this.mysocket.on(EVENTS.LOBBY.USER_LEFT,(username)=>{
                            onUserLeave(username);
                        });
                        this.mysocket.on(EVENTS.LOBBY.LOBBY_GAME_DELETED,()=>{
                            onLobbyGameDeleted(gameid);
                        });
                        this.mysocket.on(EVENTS.LOBBY.GAME_START,(gameStartObj)=>{
                            onLobbyGameStart(gameStartObj);
                        });
                        this.mysocket.on(EVENTS.LOBBY.KICKED_OUT,(kickoutobj)=>{
                            onKickedOut(kickoutobj);
                        })
                        resolve({players: ackResponse.players, stringifiedchat: ackResponse.stringifiedchat});
                    }else{
                        reject(ackResponse.error);
                        //No ack.
                    }
                });
        });
    }
    kickoutUser(user,gameid){
        return new Promise((resolve,reject)=>{
            this.mysocket.emit(EVENTS.LOBBY.KICK_OUT_USER,{ kickee:user,gameid},(ack)=>{
                if(ack)
                    resolve(ack);
                else
                    reject(ack);

            })
        });
    }
    emitMovingToGms (){
return new Promise((resolve,reject)=>{
    this.mysocket.emit(EVENTS.LOBBY.MOVING_TO_GMS,{}, (ack)=>{
       if(ack.success)resolve()
        else
            reject();
    });
});
    }
    //TODO: make unsubscribefromgameplay?
    // or just close the socket?
    // first sends 'MOVING_TO_GMS', then disconnects, then connect to gameplay.
    disconnectAppcsAndConnectToGameplay (gameStartObj, username, onPlayerSlapRegistered, onNextTick, onMatchResult, onGameStart, onGameFinished,onGameInterrupt){
        let mysocket = this.mysocket;
        return new Promise((resolve,reject)=>{
            //TODO: THIS EMIT doesn't work.
            console.log('trying to subscribe to gameplay... Emitting moving to GMS...')
            mysocket.emit(EVENTS.LOBBY.MOVING_TO_GMS,{}, (ack)=>{
                console.log(`SUBSCRIBE TO GAMEPLAY:ack object ${JSON.stringify(ack)}`);
                if(ack.success){
                    mysocket.close();
                    console.log('connectToGameplay : ack succes.')
                    this.connect(`${process.env.NODE_ENV === 'production' ? 'https': 'http'}://${process.env.API_HOST}:${process.env.API_PORT}`,gameStartObj.gametoken,
                        //TODO: Something wrong here! wtf?
                        {gamesecret: gameStartObj.gamesecret, username: username},
                        'gms'
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
                        this.mysocket.on(GMSEVENTS.GAME_FINISHED,(data)=>{
                            onGameFinished(data);
                        })
                        this.mysocket.on(GMSEVENTS.GAME_INTERRUPT,(data)=>{
                            onGameInterrupt(data);
                        })
                        resolve();
                    }).catch((e)=>reject(e));

                }else{
                    reject();
                }
            });
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
    synchronizeGameplay(){
        console.log('emitting synchronize gameplay...');
        return new Promise((resolve,reject)=>{
            this.mysocket.emit(GMSEVENTS.SYNCHRONIZE,{},(res)=>{
                if(res.success)
                    resolve(res);
                else
                    reject(res);
            })
        });

    }

    removeAllLobbyListeners(){
        this.mysocket.removeAllListeners(EVENTS.LOBBY.GAME_START);
        this.mysocket.removeAllListeners(EVENTS.LOBBY.LOBBY_GAME_DELETED);
        this.mysocket.removeAllListeners(EVENTS.LOBBY.USER_JOINED);
        this.mysocket.removeAllListeners(EVENTS.LOBBY.USER_LEFT);
    }

    unsubscribeFromLobby(userStateObj,onSuccessLeave,onfailLeave){
        if (this.mysocket) {
            this.mysocket.emit(EVENTS.LOBBY.CLIENT_LEAVE, userStateObj, (ack) => {
                if (ack === EVENTS.LOBBY.CLIENT_LEAVE_ACK) {
                    this.removeAllLobbyListeners();
                    onSuccessLeave();
                } else {
                    onfailLeave();
                }
            })
        }
    }

    // This is a private method. DOn't call this outside.
    close(){
        console.log('CLOSED SOCKET TING');
        if(this.mysocket)
            this.mysocket.close();
    }
}

const socketclient= new SocketClient();
//Object.freeze(instance);
//NOTEDIFF: we don't use object.freeze here since in this way,
//NOTEDIFF: we cannot manipulate the object once it leaves this blueprint and becomes our singleton.
export default socketclient;
//export default SocketClient;
