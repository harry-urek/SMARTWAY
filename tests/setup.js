const RedisMock = require('ioredis-mock');
const ConsulMock = require('./mocks/consul');

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.CONSUL_HOST = 'localhost';
process.env.CONSUL_PORT = '8500';

// Create mock Redis client
const redisClient = new RedisMock();

// Create mock Consul client
const consulClient = ConsulMock();

// Make mocks available globally
global.redisClient = redisClient;
global.consulClient = consulClient; 