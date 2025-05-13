const Redis = require('ioredis');
const logger = require('../logger');
const config = require('../../config');

class CacheManager {
    constructor() {
        this.redis = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password
        });

        this.redis.on('error', (error) => {
            logger.error('Redis connection error:', error);
        });

        this.redis.on('connect', () => {
            logger.info(`Connected to Redis at ${config.redis.host}:${config.redis.port}`);
        });

        this.defaultTtl = config.cache?.ttl || 3600;
        this.enabled = config.cache?.enabled !== false;
    }

    async get(key) {
        if (!this.enabled) return null;

        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    async set(key, value, ttl = this.defaultTtl) {
        if (!this.enabled) return false;

        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
            return true;
        } catch (error) {
            logger.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }

    async del(key) {
        if (!this.enabled) return false;

        try {
            await this.redis.del(key);
            return true;
        } catch (error) {
            logger.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }

    async clear() {
        if (!this.enabled) return false;

        try {
            await this.redis.flushall();
            return true;
        } catch (error) {
            logger.error('Cache clear error:', error);
            return false;
        }
    }

    async getStats() {
        try {
            const info = await this.redis.info();
            const stats = {};

            // Parse Redis INFO response
            info.split('\r\n').forEach(line => {
                const parts = line.split(':');
                if (parts.length === 2) {
                    stats[parts[0]] = parts[1];
                }
            });

            return {
                connectedClients: parseInt(stats.connected_clients) || 0,
                usedMemory: stats.used_memory_human || '0B',
                totalCommands: parseInt(stats.total_commands_processed) || 0
            };
        } catch (error) {
            logger.error('Cache stats error:', error);
            return {
                connectedClients: 0,
                usedMemory: '0B',
                totalCommands: 0
            };
        }
    }
}

module.exports = CacheManager; 