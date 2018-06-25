// we're using a shared logger class blueprint
const Logger = require('../../shared/logger/logger');


const instance = new Logger("AppCS");
module.exports = instance;
