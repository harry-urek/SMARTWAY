const CacheManager = require('../../../../src/utils/cache/cacheManager');
const logger = require('../../../../src/utils/logger');

jest.mock('../../../../src/utils/logger');
jest.mock('ioredis', () => jest.fn().mockImplementation(() => global.redisClient));

describe('CacheManager', () => {
    let cacheManager;

    beforeEach(() => {
        jest.clearAllMocks();
        cacheManager = new CacheManager();
    });

    describe('get', () => {
        it('should return cached value when key exists', async () => {
            const testKey = 'test-key';
            const testValue = { data: 'test' };

            global.redisClient.get.mockResolvedValue(JSON.stringify(testValue));

            const result = await cacheManager.get(testKey);
            expect(result).toEqual(testValue);
            expect(global.redisClient.get).toHaveBeenCalledWith(testKey);
        });

        it('should return null when key does not exist', async () => {
            const testKey = 'non-existent-key';

            global.redisClient.get.mockResolvedValue(null);

            const result = await cacheManager.get(testKey);
            expect(result).toBeNull();
        });

        it('should handle Redis errors gracefully', async () => {
            const testKey = 'test-key';
            const error = new Error('Redis error');

            global.redisClient.get.mockRejectedValue(error);

            const result = await cacheManager.get(testKey);
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('set', () => {
        it('should set value in cache with TTL', async () => {
            const testKey = 'test-key';
            const testValue = { data: 'test' };
            const ttl = 3600;

            global.redisClient.set.mockResolvedValue('OK');

            const result = await cacheManager.set(testKey, testValue, ttl);
            expect(result).toBe(true);
            expect(global.redisClient.set).toHaveBeenCalledWith(
                testKey,
                JSON.stringify(testValue),
                'EX',
                ttl
            );
        });

        it('should handle Redis errors gracefully', async () => {
            const testKey = 'test-key';
            const testValue = { data: 'test' };
            const error = new Error('Redis error');

            global.redisClient.set.mockRejectedValue(error);

            const result = await cacheManager.set(testKey, testValue);
            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('del', () => {
        it('should delete key from cache', async () => {
            const testKey = 'test-key';

            global.redisClient.del.mockResolvedValue(1);

            const result = await cacheManager.del(testKey);
            expect(result).toBe(true);
            expect(global.redisClient.del).toHaveBeenCalledWith(testKey);
        });

        it('should handle Redis errors gracefully', async () => {
            const testKey = 'test-key';
            const error = new Error('Redis error');

            global.redisClient.del.mockRejectedValue(error);

            const result = await cacheManager.del(testKey);
            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('clear', () => {
        it('should clear all cache', async () => {
            global.redisClient.flushall.mockResolvedValue('OK');

            const result = await cacheManager.clear();
            expect(result).toBe(true);
            expect(global.redisClient.flushall).toHaveBeenCalled();
        });

        it('should handle Redis errors gracefully', async () => {
            const error = new Error('Redis error');

            global.redisClient.flushall.mockRejectedValue(error);

            const result = await cacheManager.clear();
            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getStats', () => {
        it('should return cache statistics', async () => {
            const mockInfo = {
                connected_clients: '10',
                used_memory_human: '1.5M',
                total_commands_processed: '1000'
            };

            global.redisClient.info.mockResolvedValue(mockInfo);

            const result = await cacheManager.getStats();
            expect(result).toEqual({
                connected_clients: mockInfo.connected_clients,
                used_memory: mockInfo.used_memory_human,
                total_commands_processed: mockInfo.total_commands_processed
            });
        });

        it('should handle Redis errors gracefully', async () => {
            const error = new Error('Redis error');

            global.redisClient.info.mockRejectedValue(error);

            const result = await cacheManager.getStats();
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalled();
        });
    });
}); 