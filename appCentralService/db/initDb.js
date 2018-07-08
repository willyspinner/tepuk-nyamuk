//initialise tables.
import db from './db';

import logger from '../log/appcs_logger';
db.initTables().then(()=>{
        logger.info("INIT DB", "DB Initialized");
}).catch(()=>{
    logger.error("INIT DB","DB could not be initialized.")
})

