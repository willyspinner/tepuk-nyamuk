// this creates the request object.
const APPCS_PORT =3000;
//NOTE: process.env below works because we have defined it as a webpack DefinePlugin in webpack.config.js.
const ROOTURL = process.env.APPCS_HOST ? `http://${process.env.APPCS_HOST}:${APPCS_PORT}`:`http://localhost:${APPCS_PORT}`//`http://localhost:${APPCS_PORT}`;
export const NEWUSER= (username,password)=>{
// TODO process.env bindings so that we can do   "process.env.APPCS_PORT" etc.
    //TODO: OR, implement some sort of service discovery feature.
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
            game: JSON.stringify(game),
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
