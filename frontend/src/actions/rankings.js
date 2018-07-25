import request from 'request';
import {GETRANKINGS} from "../serverroutes/AppCSRoutes";

export const getRankings = (rankings)=>({
    type:'UPDATE_RANKINGS',
   rankings
})

export const startGetRankings = ()=>{
    return (rdispatch,getState)=>{
        return new Promise((resolve,reject)=>{
            if (!getState().user.token){
                reject({success:false,error:'not logged in.'});
                return;
            }
            console.log(`STARTGETRANKINGS DISPATCHING : : ${JSON.stringify(GETRANKINGS(getState().user.token))}`)
            request.get(GETRANKINGS(getState().user.token),
                (err,res,body)=>{
                if (err){
                    reject({success:false,error:'App server error in getting rankings.'});
                    return;
                }
                body = JSON.parse(body);
                console.log(`START GET RANKIGNS GOT BODY: ${JSON.stringify(body)}, type rankigns: ${typeof body.rankings}`);

                rdispatch(getRankings(body.rankings));
                resolve();

                })
        });
    }
}