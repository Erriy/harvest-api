const winston = require('winston');
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
    ],
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
    ),
});

module.exports = logger;
