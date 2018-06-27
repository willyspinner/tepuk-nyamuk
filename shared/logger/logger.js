'use strict';

/* We use a .loginfo file to initialise all logger stuff*/
const { createLogger, format, transports ,addColors} = require('winston');
const { combine, timestamp,printf } = format;

const myFormat = printf(info => {
    //return `${JSON.stringify(info)}`
    return `${info.timestamp} @ ${info.service} @ [${info.location}] ${info.level}: ${info.message}`;
});




class WillyLogger {
    constructor(serviceName ){
        this.service = serviceName;
        this.logger =  createLogger({
        format: combine(
            format.colorize(),
            timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            myFormat
        ),
        transports: [new transports.Console()]// NOTE: you can edit this should you want to output to a log file.
        });
        addColors({
            error: "bold underline red"
        })
    }

    warn (location, str){
        location = location === null || location === undefined? "-" : location;
        return this.logger.warn({message: str,service:this.service,location});


    }
    error(location, str){
        location = location === null || location === undefined? "-" : location;
        return this.logger.error({message: str,service:this.service,location});
    }
    info(location,str){
        location = location === null || location === undefined? "-" : location;
        return this.logger.info({message: str,service:this.service,location});
    }

}

module.exports = WillyLogger;
