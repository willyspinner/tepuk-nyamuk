//File for accessing appcs redis db (where we store chatroom, and potentially info abt users)
const redis  = require('redis')
const logger= require('../log/appcs_logger');
const bluebird = require('bluebird');
const redisconnectionobject = {
    host: process.env.APPCS_REDIS_PUBSUB_HOST,
    port: process.env.APPCS_REDIS_PUBSUB_PORT
};
const redisclient = redis.createClient(redisconnectionobject);

redisclient.on('error',(err)=>{
    logger.error("redisdb",`redis connection error. ${JSON.stringify(err)}`);
    process.exit(1);
})
logger.info("chatroomDb",`redis connection established @ ${redisconnectionobject.host}:${redisconnectionobject.port}`)
//  <<<<< promisifying our redis commands >>>>>:
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const N_MAX_MESSAGES = parseInt(process.env.APPCS_CHATROOM_MAX_LENGTH) || 50;
class chatroomDb {
    static pushToMainchat(msg){
        let chain = redisclient.multi();
        chain.rpush(`/main/chat`,msg);
        chain = chain.ltrim(`/main/chat`,-1 * N_MAX_MESSAGES,-1);
        return chain.execAsync();

    }
    static pushToRoomchat(gameid,msg){
        let chain = redisclient.multi();
        chain = chain.rpush(`/room/${gameid}/chat`,msg);
        chain = chain.ltrim(`/room/${gameid}/chat`,-1 * N_MAX_MESSAGES,-1);
        return chain.execAsync();

    }
    static getMainchat(){
       return redisclient.lrangeAsync(`/main/chat`,0 , -1);
    }
    static getRoomchat(gameid){
        return redisclient.lrangeAsync(`/room/${gameid}/chat`, 0 ,-1);

    }


}
module.exports = chatroomDb;
