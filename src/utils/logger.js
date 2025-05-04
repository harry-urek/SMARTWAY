const winston = require('winston');
const path = require('path');
const config = require('../config');

// Define the custom settings for each transport
const options = {
    console: {
        level: process.env.LOG_LEVEL || 'info',
        handleExceptions: true,
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                return `[${timestamp}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
                    }`;
            })
        )
    },
    file: {
        level: 'info',
        filename: path.join(config.paths?.logs || './logs', 'app.log'),
        handleExceptions: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    }
};

// Instantiate a new Winston Logger
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(options.console)
    ],
    exitOnError: false // Do not exit on handled exceptions
});

// Create log directory if it doesn't exist
if (config.paths?.logs) {
    const fs = require('fs');
    if (!fs.existsSync(config.paths.logs)) {
        fs.mkdirSync(config.paths.logs, { recursive: true });
        logger.add(new winston.transports.File(options.file));
    }
}

// Override console methods for easy integration with existing code
if (process.env.NODE_ENV !== 'test') {
    console.log = (...args) => logger.info.call(logger, ...args);
    console.info = (...args) => logger.info.call(logger, ...args);
    console.warn = (...args) => logger.warn.call(logger, ...args);
    console.error = (...args) => logger.error.call(logger, ...args);
    console.debug = (...args) => logger.debug.call(logger, ...args);
}

module.exports = logger; 