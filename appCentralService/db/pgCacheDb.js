/*

This db is used as a cache for appcs' main postgresql db.
 This is called by db.js
 */
const redis = require('redis');
const logger = require('../log/appcs_logger');
const bluebird = require('bluebird');
const redisconnectionobject = {
    host: process.env.APPCS_REDIS_PUBSUB_HOST,
    port: process.env.APPCS_REDIS_PUBSUB_PORT
};
const redisclient = redis.createClient(redisconnectionobject);
redisclient.on('error',(err)=>{
    logger.error("pgCacheDb",`redis connection error. ${JSON.stringify(err)}`);
    process.exit(1);
})
class pgCacheDb {
    /*
      resolves if still there. Rejects if not.
      NOTE: the main db.js deletes the key manually by calling method DEL below.
     */
   static getRankingByExp(){
        return new Promise((resolve,reject)=>{




        });
    }
    static expireRankingByExp (){

    }



}
module.exports = pgCacheDb;