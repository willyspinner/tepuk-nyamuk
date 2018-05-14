// this creates the request object.
//TODO: process.env bindings so that we can do   "process.env.APPCS_PORT" etc.
export const NEWUSER= (username,password)=>{
  return   {
    url : `http://localhost:${process.env.APPCS_PORT}/appcs/user/new`,
      form: {
      username,
          password
      }
  }
};
export const LOGINUSER= (username,password)=>{
    return   {
        url : `http://localhost:${process.env.PORT}/appcs/user/auth`,
        form: {
            username,
            password
        }
    }
};