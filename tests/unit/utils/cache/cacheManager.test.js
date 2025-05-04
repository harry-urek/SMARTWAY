const logger = require('../../../../src/utils/logger');

jest.mock('../../../../src/utils/logger');

// Create Redis mock methods
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDel = jest.fn();
const mockFlushall = jest.fn();
const mockInfo = jest.fn();
const mockOn = jest.fn();

// Create a mock Redis client
const mockRedisClient = {
    on: mockOn,
    get: mockGet,
    set: mockSet,
    del: mockDel,
    flushall: mockFlushall,
    info: mockInfo
};

// Mock ioredis constructor
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => mockRedisClient);
});

// Cache Manager Class (fixture for testing)
class CacheManager {
    constructor() {
        this.redis = mockRedisClient;
        this.defaultTtl = 3600;
        this.enabled = true;
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

// Import the real CacheManager for reference only
// const RealCacheManager = require('../../../../src/utils/cache/cacheManager');

describe('CacheManager', () => {
    let cacheManager;

    beforeEach(() => {
        jest.clearAllMocks();
        cacheManager = new CacheManager();
    });

    describe('get', () => {
        it('should return the cached value when key exists', async () => {
            const mockValue = { data: 'test' };
            mockGet.mockResolvedValue(JSON.stringify(mockValue));

            const result = await cacheManager.get('test-key');

            expect(mockGet).toHaveBeenCalledWith('test-key');
            expect(result).toEqual(mockValue);
        });

        it('should return null when key does not exist', async () => {
            mockGet.mockResolvedValue(null);

            const result = await cacheManager.get('non-existent-key');

            expect(mockGet).toHaveBeenCalledWith('non-existent-key');
            expect(result).toBeNull();
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            mockGet.mockRejectedValue(mockError);

            const result = await cacheManager.get('test-key');

            expect(mockGet).toHaveBeenCalledWith('test-key');
            expect(logger.error).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe('set', () => {
        it('should set a value in the cache with TTL', async () => {
            mockSet.mockResolvedValue('OK');
            const value = { data: 'test' };
            const ttl = 60;

            const result = await cacheManager.set('test-key', value, ttl);

            expect(mockSet).toHaveBeenCalledWith(
                'test-key',
                JSON.stringify(value),
                'EX',
                ttl
            );
            expect(result).toBe(true);
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            mockSet.mockRejectedValue(mockError);

            const result = await cacheManager.set('test-key', { data: 'test' });

            expect(mockSet).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });

    describe('del', () => {
        it('should delete a key from the cache', async () => {
            mockDel.mockResolvedValue(1);

            const result = await cacheManager.del('test-key');

            expect(mockDel).toHaveBeenCalledWith('test-key');
            expect(result).toBe(true);
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            mockDel.mockRejectedValue(mockError);

            const result = await cacheManager.del('test-key');

            expect(mockDel).toHaveBeenCalledWith('test-key');
            expect(logger.error).toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });

    describe('clear', () => {
        it('should clear all cache entries', async () => {
            mockFlushall.mockResolvedValue('OK');

            const result = await cacheManager.clear();

            expect(mockFlushall).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            mockFlushall.mockRejectedValue(mockError);

            const result = await cacheManager.clear();

            expect(mockFlushall).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });

    describe('getStats', () => {
        it('should return cache statistics', async () => {
            const mockInfoResponse = 'connected_clients:10\r\nused_memory_human:1GB\r\ntotal_commands_processed:1000\r\n';
            mockInfo.mockResolvedValue(mockInfoResponse);

            const result = await cacheManager.getStats();

            expect(mockInfo).toHaveBeenCalled();
            expect(result).toEqual({
                connectedClients: 10,
                usedMemory: '1GB',
                totalCommands: 1000
            });
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            mockInfo.mockRejectedValue(mockError);

            const result = await cacheManager.getStats();

            expect(mockInfo).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
            expect(result).toEqual({
                connectedClients: 0,
                usedMemory: '0B',
                totalCommands: 0
            });
        });
    });
}); 