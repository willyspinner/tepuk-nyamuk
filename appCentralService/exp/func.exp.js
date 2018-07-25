const db = require('../db/db');
const LEVELS = require('./expConfig').EXPLEVELS;
const logger = require('../log/appcs_logger');
class Scorer {
    static calculateExpGains(resultObj,totalgametimesecs){
        const scoreresults = resultObj.finalscores;
        // {username: ___, score ___}.
        //logger.info(`func.exp.js::calculateExpGains:`,`totalgametime multiplier : ${parseInt(totalgametime)} / 60 = ${parseInt(totalgametime)/60}`)
        return scoreresults.map((scoreresult)=>(
            {
                username: scoreresult.username,
                expUpdate: Math.round((scoreresult.score<=0 ? 100: scoreresult.score )/ (parseInt(totalgametimesecs) / 100))
            }
                ));
    }
    static getExpAndLevel(username){
        return db.getExpAndLevel(username);
    }

    static getLevel(idx){
        if( idx >=LEVELS.length)
            return  LEVELS[LEVELS.length - 1];
        else
            return LEVELS[idx];
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
                            currentLevelIdx : level,
                            currentExp,
                            currentLevelObj: Scorer.getLevel(level),
                            nextLevelObj: Scorer.getLevel(level + 1)
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
