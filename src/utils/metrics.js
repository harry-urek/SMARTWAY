const prometheus = require('prom-client');
const config = require('../config');

// Initialize default metrics
prometheus.collectDefaultMetrics({
    timeout: 5000,
    prefix: 'gateway_'
});

// Custom metrics
const requestDuration = new prometheus.Histogram({
    name: 'gateway_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
});

const activeRequests = new prometheus.Gauge({
    name: 'gateway_active_requests',
    help: 'Number of active requests'
});

const errorCounter = new prometheus.Counter({
    name: 'gateway_errors_total',
    help: 'Total number of errors',
    labelNames: ['type']
});

module.exports = {
    prometheus,
    requestDuration,
    activeRequests,
    errorCounter
}; 