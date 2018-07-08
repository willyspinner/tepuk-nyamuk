//initialise tables.
const db = require('./db');
const logger = require('../log/appcs_logger');
db.initTables().then(()=>{
        logger.info("INIT DB", "DB Initialized");
}).catch(()=>{
    logger.error("INIT DB","DB could not be initialized.")
})

