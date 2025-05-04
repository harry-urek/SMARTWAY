const winston = require('winston');
const path = require('path');
const config = require('../config');

const logger = winston.createLogger({
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(config.paths.logs, 'error.log'),
            level: 'error'
        }),
        new winston.transports.File({
            filename: path.join(config.paths.logs, 'combined.log')
        })
    ]
});

if (config.nodeEnv !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger; 