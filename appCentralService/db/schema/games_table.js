const CONSTANTS = require('./fields').GAMES;
module.exports = {
    INIT: `CREATE TABLE IF NOT EXISTS GAMES(` +
    `${CONSTANTS.PLAYERS} text[],` +
    `${CONSTANTS.UUID} uuid,` +
    `${CONSTANTS.STATUS} char(3),` +
    `${CONSTANTS.RESULT} json,` +
    `${CONSTANTS.CREATEDAT} bigint,` +
    `${CONSTANTS.CREATOR} text`+
    `);`

}