import request from 'request';
import {NEWUSER,LOGINUSER} from "../serverroutes/AppCSRoutes";

//NOTE: I don't think we need this userRegistered action here.

export const userLoggedIn = (username,token)=>({
    type: 'USER_LOGGED_IN',
    username,
    token
})
export const startRegisterUser = (username,password)=> {
    return (reduxDispatch) => {
        return new Promise((resolve, reject) => {
            request.post(NEWUSER(username, password),
                (err, res, body) => {
                    if (err){
                        reject({error:"server error. Unable to connect at this time."});
                        return;
                    }
                    if(!body){
                        reject({error: "server error"});
                        return;
                    }
                    let resobj = JSON.parse(body);
                    if (resobj.success) {
                        reduxDispatch(userLoggedIn(username, resobj.token));
                        resolve(resobj);
                    }
                    else reject(resobj);
                });
        });
    }
}
export const startLoginUser = (username,password)=>{
    return (reduxDispatch) => {
        return new Promise((resolve, reject) => {
            request.post(LOGINUSER(username, password),
                (err, res, body) => {
                    if (err){
                        reject({error:"server error. Unable to connect at this time."});
                       return;
                    }

                    console.log(`! body: ${!body}`);
                   if(!body){
                       reject({error: "server error"});
                       return;
                   }

                    let resobj = JSON.parse(body);
                    
                    if (resobj.success) {
                        reduxDispatch(userLoggedIn(username, resobj.token));
                        resolve(resobj);
                    }
                    else reject(resobj);
                });
        });
    }
}
export const logoutUser = ()=>({
    type:"USER_LOG_OUT"
    });

export const connectSocket = (socketid)=>({
    type: "USER_CONNECT_SOCKET",
    socketid
})


export const startConnectSocket = ()=>{
    return (reduxDispatch)=>{
        return new Promise((resolve,reject)=>{
            
        });
    }
}