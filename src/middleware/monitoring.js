const { requestDuration, activeRequests, errorCounter } = require('../utils/metrics');
const logger = require('../utils/logger');

const monitoringMiddleware = (req, res, next) => {
    const start = Date.now();
    activeRequests.inc();

    // Log request
    logger.info({
        method: req.method,
        url: req.url,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Response monitoring
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        requestDuration
            .labels(req.method, req.route?.path || req.url, res.statusCode)
            .observe(duration);
        activeRequests.dec();

        if (res.statusCode >= 400) {
            errorCounter.inc({ type: 'http_error' });
        }
    });

    next();
};

module.exports = monitoringMiddleware; 