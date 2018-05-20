import ioclient from 'socket.io-client';
import EVENTS from '../../../appCentralService/constants/socketEvents';

class SocketClient {
    connect(connectionStr,token){
        return new Promise((resolve,reject)=>{
            
            console.log(`io client obj: ${JSON.stringify(ioclient)}`);
            console.log(`in connect method of SocketClient... trying to connect socket ;..`);
            console.log(`connectionSTr: ${connectionStr}`);
            console.log(`socket connecting with token : ${token}`);
                this.socket = ioclient(connectionStr,{
                    query: {
                        token:token
                    }
                }
                );

            setTimeout(()=>reject("time out . more than 6000 ms"),6000);
            console.log(`listening to connect event.`);
            this.socket.on('connect',()=>{
                console.log(`socket connected and authenticated`);
                resolve();
            });
        });
    }

    subscribeToMainPage(onGameCreate,onGameDelete){
        this.socket.on(EVENTS.GAME_CREATED,(data)=>onGameCreate(data.game));
        this.socket.on(EVENTS.GAME_DELETED,(data)=> onGameDelete(data.game));
    }
    unsubscribeToMainPage(){
        this.socket.removeAllListeners(EVENTS.GAME_CREATED);
        this.socket.removeAllListeners(EVENTS.GAME_DELETED);
    }
    subscribeToLobby(username,gameid,onUserJoin,onUserLeave){
        this.socket.emit(EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN,{username,gameid},
            (ackResponse)=>{
                if(ackResponse ===EVENTS.LOBBY.CLIENT_ATTEMPT_JOIN_ACK){
                    this.socket.on(EVENTS.LOBBY.USER_JOINED,(username)=>{
                        onUserJoin(username);
                    })
                    this.socket.on(EVENTS.LOBBY.USER_LEFT,(username)=>{
                        onUserLeave(username);
                    })
                }else{
                    //No ack.
                }
        });
    }

    unsubscribeFromLobby(userStateObj,onSuccessLeave,onfailLeave){
        this.socket.emit(EVENTS.LOBBY.CLIENT_LEAVE,userStateObj,(ack)=>{
            if(ack === EVENTS.LOBBY.CLIENT_LEAVE_ACK){
                onSuccessLeave();
            }else{
                onfailLeave();
            }
        })
    }


    close(){
        if(this.socket)
            this.socket.close();
    }
}

const instance = new SocketClient();
Object.freeze(instance);
export default instance;
