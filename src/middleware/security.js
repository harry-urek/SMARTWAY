const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('../config');

const securityMiddleware = [
    helmet(),
    cors({
        origin: config.gateway.pipelines.default.policies.find(p => p.cors).action.origin,
        methods: config.gateway.pipelines.default.policies.find(p => p.cors).action.methods,
        allowedHeaders: config.gateway.pipelines.default.policies.find(p => p.cors).action.allowedHeaders
    }),
    rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.max
    })
];

module.exports = securityMiddleware; 