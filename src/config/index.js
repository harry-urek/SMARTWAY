const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
require('dotenv').config();

const gatewayConfig = yaml.load(fs.readFileSync(path.join(__dirname, '../../gateway.config.yml'), 'utf8'));

module.exports = {
    port: process.env.PORT || 8080,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET,
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    prometheus: {
        pushgatewayUrl: process.env.PROMETHEUS_PUSHGATEWAY_URL
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD
    },
    consul: {
        host: process.env.CONSUL_HOST || 'localhost',
        port: parseInt(process.env.CONSUL_PORT) || 8500
    },
    gateway: gatewayConfig,
    paths: {
        logs: path.join(__dirname, '../../logs')
    },
    api: {
        versions: ['v1', 'v2'],
        defaultVersion: 'v1'
    },
    security: {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Version']
        },
        rateLimit: {
            windowMs: 900000,
            max: 100
        }
    },
    cache: {
        ttl: parseInt(process.env.CACHE_TTL) || 3600,
        enabled: process.env.CACHE_ENABLED === 'true'
    }
}; 