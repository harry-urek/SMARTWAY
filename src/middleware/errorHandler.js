const logger = require('../utils/logger');
const { errorCounter } = require('../utils/metrics');
const config = require('../config');

const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error({
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });

    // Increment error counter
    errorCounter.inc({ type: err.name || 'unknown' });

    // Send response
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
    });
};

module.exports = errorHandler; 