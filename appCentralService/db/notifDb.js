const redis  = require('redis')
const logger= require('../log/appcs_logger');
const bluebird = require('bluebird');
const redisconnectionobject = {
    host: process.env.APPCS_REDIS_PUBSUB_HOST,
    port: process.env.APPCS_REDIS_PUBSUB_PORT
};
const redisclient = redis.createClient(redisconnectionobject);

redisclient.on('error',(err)=>{
    logger.error("notifdb",`redis connection error. ${JSON.stringify(err)}`);
    process.exit(1);
})
logger.info("notifdb",`redis connection established @ ${redisconnectionobject.host}:${redisconnectionobject.port}`)
//  <<<<< promisifying our redis commands >>>>>:
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
class NotifDb{
    static setNotif(username,msg){
        return redisclient.setAsync(`/notif/user/${username}`,msg);
    }
    static getNotifAndExpire(username){
        return (async ()=>{
           const notif = await redisclient.getAsync(`/notif/user/${username}`);
           await redisclient.expireAsync(`/notif/user/${username}`,-1);
           return notif;
        })();

    }

}
module.exports = NotifDb;
