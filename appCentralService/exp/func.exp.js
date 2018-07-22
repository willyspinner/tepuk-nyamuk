const db = require('../db/db');
const dbfields = require('../db/schema/dbconstants');
const USER = dbfields.USERS;
const LEVELS = require('./expConfig').EXPLEVELS;
class Scorer {

   static bulkIncrementExpAndLevel(expUpdateObjs){
        /*
        obj is of the form:
        {username : ___, expUpdate: ___}
         */
        /* returns updates  in teh form

        {username: ___, currentLevel: ___, currentExp:___, currentLevelname: ___}
         */
        return new Promise((resolve,reject)=>{

            Promise.all(expUpdateObjs.map((obj)=>db.incrementExp(obj.username,obj.expUpdate))).then((updatedScorers)=>{
                /* update scorings:
                of the form: {  exp, level, username}
                 */
                let finalobj = [];
                Promise.all(
                    updatedScorers.map((updatedScorer)=>{
                        const level = updatedScorer[USER.LEVEL];
                        if (LEVELS[level].threshold <= parseInt(updatedScorer[USER.EXP])){
                            updatedScorer.currentLevel = updatedScorers[USER.LEVEL] + 1;
                            finalobj.push({
                                username: updatedScorer[USER.USERNAME],
                                currentLevel : updatedScorer.currentLevel,
                                currentExp: updatedScorer[USER.EXP],
                                currentLevelname: LEVELS[updatedScorer.currentLevel].levelname
                            });
                            return db.incrementLevel(username);
                        }else{
                            updatedScorer.currentLevel = updatedScorers[USER.LEVEL];
                            finalobj.push({
                                username: updatedScorer[USER.USERNAME],
                                currentLevel : updatedScorer.currentLevel,
                                currentExp: updatedScorer[USER.EXP],
                                currentLevelname: LEVELS[updatedScorer.currentLevel].levelname
                            });
                            return null;
                        }
                    })
                ).then(()=>{
                    resolve(finalObj);

                })

            })
        });
    }

}
module.exports = Scorer;
