const CacheManager = require('../../../../src/utils/cache/cacheManager');
const logger = require('../../../../src/utils/logger');

jest.mock('../../../../src/utils/logger');
jest.mock('ioredis', () => jest.fn().mockImplementation(() => {
    return {
        on: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        flushall: jest.fn(),
        info: jest.fn()
    };
}));

describe('CacheManager', () => {
    let cacheManager;

    beforeEach(() => {
        jest.clearAllMocks();
        cacheManager = new CacheManager();
    });

    describe('get', () => {
        it('should return the cached value when key exists', async () => {
            const mockValue = { data: 'test' };
            cacheManager.redis.get.mockResolvedValue(JSON.stringify(mockValue));

            const result = await cacheManager.get('test-key');

            expect(cacheManager.redis.get).toHaveBeenCalledWith('test-key');
            expect(result).toEqual(mockValue);
        });

        it('should return null when key does not exist', async () => {
            cacheManager.redis.get.mockResolvedValue(null);

            const result = await cacheManager.get('non-existent-key');

            expect(cacheManager.redis.get).toHaveBeenCalledWith('non-existent-key');
            expect(result).toBeNull();
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            cacheManager.redis.get.mockRejectedValue(mockError);

            const result = await cacheManager.get('test-key');

            expect(cacheManager.redis.get).toHaveBeenCalledWith('test-key');
            expect(logger.error).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe('set', () => {
        it('should set a value in the cache with TTL', async () => {
            cacheManager.redis.set.mockResolvedValue('OK');
            const value = { data: 'test' };
            const ttl = 60;

            const result = await cacheManager.set('test-key', value, ttl);

            expect(cacheManager.redis.set).toHaveBeenCalledWith(
                'test-key',
                JSON.stringify(value),
                'EX',
                ttl
            );
            expect(result).toBe(true);
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            cacheManager.redis.set.mockRejectedValue(mockError);

            const result = await cacheManager.set('test-key', { data: 'test' });

            expect(cacheManager.redis.set).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });

    describe('del', () => {
        it('should delete a key from the cache', async () => {
            cacheManager.redis.del.mockResolvedValue(1);

            const result = await cacheManager.del('test-key');

            expect(cacheManager.redis.del).toHaveBeenCalledWith('test-key');
            expect(result).toBe(true);
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            cacheManager.redis.del.mockRejectedValue(mockError);

            const result = await cacheManager.del('test-key');

            expect(cacheManager.redis.del).toHaveBeenCalledWith('test-key');
            expect(logger.error).toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });

    describe('clear', () => {
        it('should clear all cache entries', async () => {
            cacheManager.redis.flushall.mockResolvedValue('OK');

            const result = await cacheManager.clear();

            expect(cacheManager.redis.flushall).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            cacheManager.redis.flushall.mockRejectedValue(mockError);

            const result = await cacheManager.clear();

            expect(cacheManager.redis.flushall).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });

    describe('getStats', () => {
        it('should return cache statistics', async () => {
            const mockInfo = 'connected_clients:10\r\nused_memory_human:1GB\r\ntotal_commands_processed:1000\r\n';
            cacheManager.redis.info.mockResolvedValue(mockInfo);

            const result = await cacheManager.getStats();

            expect(cacheManager.redis.info).toHaveBeenCalled();
            expect(result).toEqual({
                connectedClients: 10,
                usedMemory: '1GB',
                totalCommands: 1000
            });
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            cacheManager.redis.info.mockRejectedValue(mockError);

            const result = await cacheManager.getStats();

            expect(cacheManager.redis.info).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
            expect(result).toEqual({
                connectedClients: 0,
                usedMemory: '0B',
                totalCommands: 0
            });
        });
    });
}); 