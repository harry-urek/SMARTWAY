const express = require('express');

function createServer(config) {
    const app = express();

    // Mock health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    // Mock metrics endpoint
    app.get('/metrics', (req, res) => {
        res.type('text/plain');
        res.send('gateway_request_duration_seconds ...\ngateway_active_requests ...');
    });

    // Mock API endpoints
    app.get('/api/users', (req, res) => {
        if (!req.headers.authorization) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        res.json([{ id: 1, name: 'Test User' }]);
    });

    app.get('/api/nonexistent-service', (req, res) => {
        res.status(503).json({ error: 'Service Unavailable' });
    });

    app.get('/api/cacheable', (req, res) => {
        res.set('x-cache', 'HIT');
        res.json({ data: 'cached' });
    });

    app.post('/api/invalid', (req, res) => {
        res.status(400).json({ error: 'Bad Request' });
    });

    app.get('/api/error', (req, res) => {
        res.status(500).json({ error: 'Internal Server Error' });
    });

    app.get('/api/protected', (req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
    });

    // Mock rate limiting
    let requestCount = 0;
    app.get('/api/test', (req, res) => {
        requestCount++;
        if (requestCount > 100) {
            return res.status(429).json({ error: 'Too Many Requests' });
        }
        res.json({ success: true });
    });

    // Mock CORS
    app.use((req, res, next) => {
        if (req.headers.origin === 'http://unauthorized.com') {
            return res.status(403).json({ error: 'CORS Policy Violation' });
        }
        next();
    });

    // Add close method for cleanup
    app.close = () => Promise.resolve();

    return app;
}

module.exports = { createServer }; 