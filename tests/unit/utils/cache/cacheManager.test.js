const CacheManager = require('../../../../src/utils/cache/cacheManager');
const logger = require('../../../../src/utils/logger');

jest.mock('../../../../src/utils/logger');

// Mock implementation that will be used for Redis
const mockRedisImplementation = {
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushall: jest.fn(),
    info: jest.fn()
};

// Mock the ioredis constructor
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => mockRedisImplementation);
});

describe('CacheManager', () => {
    let cacheManager;

    beforeEach(() => {
        jest.clearAllMocks();
        cacheManager = new CacheManager();
    });

    describe('get', () => {
        it('should return the cached value when key exists', async () => {
            const mockValue = { data: 'test' };
            mockRedisImplementation.get.mockResolvedValue(JSON.stringify(mockValue));

            const result = await cacheManager.get('test-key');

            expect(mockRedisImplementation.get).toHaveBeenCalledWith('test-key');
            expect(result).toEqual(mockValue);
        });

        it('should return null when key does not exist', async () => {
            mockRedisImplementation.get.mockResolvedValue(null);

            const result = await cacheManager.get('non-existent-key');

            expect(mockRedisImplementation.get).toHaveBeenCalledWith('non-existent-key');
            expect(result).toBeNull();
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            mockRedisImplementation.get.mockRejectedValue(mockError);

            const result = await cacheManager.get('test-key');

            expect(mockRedisImplementation.get).toHaveBeenCalledWith('test-key');
            expect(logger.error).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe('set', () => {
        it('should set a value in the cache with TTL', async () => {
            mockRedisImplementation.set.mockResolvedValue('OK');
            const value = { data: 'test' };
            const ttl = 60;

            const result = await cacheManager.set('test-key', value, ttl);

            expect(mockRedisImplementation.set).toHaveBeenCalledWith(
                'test-key',
                JSON.stringify(value),
                'EX',
                ttl
            );
            expect(result).toBe(true);
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            mockRedisImplementation.set.mockRejectedValue(mockError);

            const result = await cacheManager.set('test-key', { data: 'test' });

            expect(mockRedisImplementation.set).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });

    describe('del', () => {
        it('should delete a key from the cache', async () => {
            mockRedisImplementation.del.mockResolvedValue(1);

            const result = await cacheManager.del('test-key');

            expect(mockRedisImplementation.del).toHaveBeenCalledWith('test-key');
            expect(result).toBe(true);
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            mockRedisImplementation.del.mockRejectedValue(mockError);

            const result = await cacheManager.del('test-key');

            expect(mockRedisImplementation.del).toHaveBeenCalledWith('test-key');
            expect(logger.error).toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });

    describe('clear', () => {
        it('should clear all cache entries', async () => {
            mockRedisImplementation.flushall.mockResolvedValue('OK');

            const result = await cacheManager.clear();

            expect(mockRedisImplementation.flushall).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            mockRedisImplementation.flushall.mockRejectedValue(mockError);

            const result = await cacheManager.clear();

            expect(mockRedisImplementation.flushall).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });

    describe('getStats', () => {
        it('should return cache statistics', async () => {
            const mockInfo = 'connected_clients:10\r\nused_memory_human:1GB\r\ntotal_commands_processed:1000\r\n';
            mockRedisImplementation.info.mockResolvedValue(mockInfo);

            const result = await cacheManager.getStats();

            expect(mockRedisImplementation.info).toHaveBeenCalled();
            expect(result).toEqual({
                connectedClients: 10,
                usedMemory: '1GB',
                totalCommands: 1000
            });
        });

        it('should handle redis errors gracefully', async () => {
            const mockError = new Error('Redis error');
            mockRedisImplementation.info.mockRejectedValue(mockError);

            const result = await cacheManager.getStats();

            expect(mockRedisImplementation.info).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
            expect(result).toEqual({
                connectedClients: 0,
                usedMemory: '0B',
                totalCommands: 0
            });
        });
    });
}); 