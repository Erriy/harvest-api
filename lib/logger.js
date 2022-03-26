const winston = require('winston');
const logger = winston.createLogger({
    level     : 'info',
    transports: [
        new winston.transports.Console(),
    ],

    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.prettyPrint(),
    ),
});

module.exports = logger;
