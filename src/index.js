const { createServer } = require('express-gateway');
const config = require('./config');
const logger = require('./utils/logger');
const { prometheus } = require('./utils/metrics');
const securityMiddleware = require('./middleware/security');
const monitoringMiddleware = require('./middleware/monitoring');
const errorHandler = require('./middleware/errorHandler');

// Create Express Gateway server
const gateway = createServer({
    gatewayConfig: config.gateway
});

// Apply security middleware
securityMiddleware.forEach(middleware => gateway.use(middleware));

// Apply monitoring middleware
gateway.use(monitoringMiddleware);

// Add Prometheus metrics endpoint
gateway.get('/metrics', async (req, res) => {
    res.set('Content-Type', prometheus.register.contentType);
    res.end(await prometheus.register.metrics());
});

// Apply error handling middleware
gateway.use(errorHandler);

// Start the server
gateway.listen(config.port, () => {
    logger.info(`API Gateway running on port ${config.port}`);
}); 