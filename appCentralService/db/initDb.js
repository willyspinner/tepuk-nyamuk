//initialise tables.
require('dotenv').config({path: `${__dirname}/../.appcs.test.env`});
const db = require('./db');
const logger = require('../log/appcs_logger');
db.initTables().then(()=>{
        logger.info("INIT DB", "DB Initialized");
        process.exit(0);
}).catch(()=>{
    logger.error("INIT DB","DB could not be initialized.")
    process.exit(1);
})

