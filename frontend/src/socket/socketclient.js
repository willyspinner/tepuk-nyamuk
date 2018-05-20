//import io from 'socket.io-client/dist/socket.io';
import EVENTS from '../../../appCentralService/constants/socketEvents';
//import ioclient from 'socket.io-client';
const ioclient = require('socket.io-client');
class SocketClient {
    mysocket=null;
    connect(connectionStr, token){
        let thatsocket = this.mysocket;
        return new Promise((resolve,reject)=>{
            console.log(`in connect method of SocketClient... trying to connect socket ;..`);
            console.log(`connectionSTr: ${connectionStr}`);
            console.log(`socket connecting with token : ${token}`);

            thatsocket =  ioclient(`${connectionStr}`,{
                    query: {
                        token:token
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

    subscribeToMainPage(onGameCreate,onGameDelete){
        this.mysocket.on(EVENTS.GAME_CREATED,(data)=>onGameCreate(data.game));
        this.mysocket.on(EVENTS.GAME_DELETED,(data)=> onGameDelete(data.gameuuid));
    }
    unsubscribeToMainPage(){
        this.mysocket.removeAllListeners(EVENTS.GAME_CREATED);
        this.mysocket.removeAllListeners(EVENTS.GAME_DELETED);
    }
    subscribeToLobby(username,gameid,onUserJoin,onUserLeave,onLobbyGameStart,onLobbyGameDeleted){
        this.mysocket.emit(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN,{username,gameid},
            (ackResponse)=>{
                if(ackResponse ===EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_ACK){
                    this.mysocket.on(EVENTS.LOBBY.USER_JOINED,(username)=>{
                        onUserJoin(username);
                    })
                    this.mysocket.on(EVENTS.LOBBY.USER_LEFT,(username)=>{
                        onUserLeave(username);
                    })
                    this.mysocket.on(EVENTS.LOBBY.LOBBY_GAME_DELETED,()=>{
                       onLobbyGameDeleted();
                    })
                    this.mysocket.on(EVENTS.LOBBY.GAME_START,(gameStartObj)=>{
                        //TODO: establish GMS connection here...
                        onLobbyGameStart();
                    })
                }else{
                    //No ack.
                }
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
