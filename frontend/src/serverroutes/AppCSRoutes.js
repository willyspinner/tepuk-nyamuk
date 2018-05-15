// this creates the request object.
const APPCS_PORT =3000;
const ROOTURL = `http://localhost:${APPCS_PORT}`;
export const NEWUSER= (username,password)=>{
//TODO: for now this is ok, but later,
// TODO process.env bindings so that we can do   "process.env.APPCS_PORT" etc.
    //TODO: OR, implement some sort of service discovery feature.
  const obj =  {
    url : `${ROOTURL}/appcs/user/new`,
      form: {
      username,
          password
      },
      timeout: 16000, // 16 sec timeout
  }
  
  return obj;
};
export const GETOPENGAMES= ()=>{
    return   {
        url : `${ROOTURL}/appcs/game`,
        form: {
            username,
            password
        },
        timeout: 16000, // 16 sec timeout
    }
}
export const LOGINUSER = (username,password)=>{
    return   {
        url : `${ROOTURL}/appcs/user/auth`,
        form: {
            username,
            password
        },
        timeout: 16000, // 16 sec timeout
    }
};