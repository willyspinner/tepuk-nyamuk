// we're using a shared logger class blueprint
const Logger = require('../../shared/logger/logger');


const instance = new Logger("GMS");
module.exports = instance;
