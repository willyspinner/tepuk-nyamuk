const db = require('../db/db');
const LEVELS = require('./expConfig').EXPLEVELS;
const logger = require('../log/appcs_logger');
class Scorer {
    static calculateExpGains(resultObj){
        const scoreresults = resultObj.finalscores;
        // {username: ___, score ___}.
        return scoreresults.map((scoreresult)=>({username: scoreresult.username,expUpdate: Math.round(scoreresult.score)}));
    }
    static getExpAndLevel(username){
        return db.getExpAndLevel(username);
    }

   static bulkIncrementExpAndLevel(expUpdateObjs){
        /*
        obj is of the form:
        {username : ___, expUpdate: ___}
         */
        /* returns updates  in teh form

        {username: ___, currentLevel: ___, currentExp:___, currentLevelname: ___}
         */
        return new Promise((resolve,reject)=>{
            Promise.all(expUpdateObjs.map((obj)=> db.getExpAndLevel(obj.username)))
                .then((players)=>{
                let finalObj = [];
                Promise.all(
                    players.map((player,idx)=>{
                        const oldlevel = player.level;
                        let level = player.level;
                        const incrExp = expUpdateObjs[idx].expUpdate;
                        const currentExp =  parseInt(player.exp) + incrExp;
                        if (LEVELS[level].threshold <= currentExp){
                            for( ;LEVELS[level].threshold && LEVELS[level].threshold < currentExp ; level++ );
                        }
                        finalObj.push({
                            username: player.username,
                            currentLevel : level,
                            currentExp,
                            currentLevelname: LEVELS[level].levelname
                        });
                        return db.updateExpAndLevel(player.username,incrExp,oldlevel === level? undefined: level);
                    })
                ).then(()=>{
                    resolve(finalObj);

                }).catch((e)=>reject(e));
            }).catch((e)=>reject(e));
        });
    }

}
module.exports = Scorer;
