const CONSTANTS = require('./fields').USERS;
module.exports = {
    INIT: `CREATE TABLE IF NOT EXISTS USERS(` +
    `${CONSTANTS.USERNAME} text,` +
    `${CONSTANTS.SOCKET_ID} text,` +
    `${CONSTANTS.GAMEID} uuid,`+
        `${CONSTANTS.PASSWORD} text`+
    `);`

};