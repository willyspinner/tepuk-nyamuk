// this creates the request object.
//NOTE: process.env below works because we have defined it as a webpack DefinePlugin in webpack.config.js.
const ROOTURL=`http://${process.env.API_HOST}:${process.env.API_PORT}`;
export const NEWUSER= (username,password)=>{
  const obj =  {
    url : `${ROOTURL}/appcs/user/new`,
      form: {
      username,
          password
      },
      timeout: 16000, // 16 sec timeout
  };
  
  return obj;
};
export const GETOPENGAMES= ()=>{
    return   {
        url : `${ROOTURL}/appcs/game`,
        timeout: 16000, // 16 sec timeout
    }
};
export const LOGINUSER = (username,password)=>{
    console.log(`process env :${JSON.stringify(process.env)} `)
    console.log(`going to ${ROOTURL}/appcs/user/auth`);
    return   {
        url : `${ROOTURL}/appcs/user/auth`,
        form: {
            username,
            password
        },
        timeout: 16000, // 16 sec timeout
    }
};

export const CREATEGAME=(game,token)=>{
    return   {
        url : `${ROOTURL}/appcs/game/create`,
        form: {
            game: game,
            token
        },
        timeout: 16000, // 16 sec timeout
    }
};
export const DELETEGAME= (gameid,token,socketid)=>{
    return {
        url: `${ROOTURL}/appcs/game/delete/${gameid}`,
        form: {
            socketid: socketid,
            token: token,
        },
    };
};

export const STARTGAMEFROMLOBBY=(gameid,token,socketid)=>{
    return {
        url: `${ROOTURL}/appcs/game/start/${gameid}`,
        form : {
            socketid: socketid,
            token : token
        }
    }
}