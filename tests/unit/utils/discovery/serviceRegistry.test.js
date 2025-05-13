const ServiceRegistry = require('../../../../src/utils/discovery/serviceRegistry');
const logger = require('../../../../src/utils/logger');

jest.mock('../../../../src/utils/logger');
jest.mock('consul', () => jest.fn().mockImplementation(() => ({
    agent: {
        service: {
            register: jest.fn(),
            deregister: jest.fn()
        }
    },
    health: {
        service: jest.fn()
    }


})));

describe('ServiceRegistry', () => {
    let serviceRegistry;

    beforeEach(() => {
        jest.clearAllMocks();
        serviceRegistry = new ServiceRegistry();
    });

    describe('registerService', () => {
        it('should register a service with Consul', async () => {
            serviceRegistry.consul.agent.service.register.mockResolvedValue(true);

            const serviceId = 'test-service-123';
            const serviceName = 'test-service';
            const port = 3000;
            const healthCheck = {
                http: 'http://localhost:3000/health',
                interval: '10s'
            };

            const result = await serviceRegistry.registerService(
                serviceId,
                serviceName,
                port,
                healthCheck
            );

            expect(serviceRegistry.consul.agent.service.register).toHaveBeenCalledWith({
                id: serviceId,
                name: serviceName,
                port: port,
                check: healthCheck
            });
            expect(result).toBe(true);
            expect(logger.info).toHaveBeenCalled();


        });

        it('should handle registration errors', async () => {
            const error = new Error('Registration failed');
            serviceRegistry.consul.agent.service.register.mockRejectedValue(error);





            const serviceId = 'test-service-123';
            const serviceName = 'test-service';
            const port = 3000;
            const healthCheck = { http: 'http://localhost:3000/health' };

            await expect(
                serviceRegistry.registerService(serviceId, serviceName, port, healthCheck)
            ).rejects.toThrow('Failed to register service');

            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('discoverService', () => {
        it('should discover a healthy service', async () => {
            const mockServices = [
                {
                    Service: { Address: 'localhost', Port: 3001 },
                    Checks: [{ Status: 'passing' }]
                },
                {
                    Service: { Address: 'localhost', Port: 3002 },
                    Checks: [{ Status: 'passing' }]
                }
            ];

            serviceRegistry.consul.health.service.mockResolvedValue(mockServices);

            const result = await serviceRegistry.discoverService('test-service');

            expect(serviceRegistry.consul.health.service).toHaveBeenCalledWith('test-service');
            expect(result).toHaveProperty('host');
            expect(result).toHaveProperty('port');
            expect([3001, 3002]).toContain(result.port);
        });

        it('should throw error when no healthy services found', async () => {
            const mockServices = [
                {
                    Service: { Address: 'localhost', Port: 3001 },
                    Checks: [{ Status: 'critical' }]
                }
            ];

            serviceRegistry.consul.health.service.mockResolvedValue(mockServices);

            await expect(serviceRegistry.discoverService('test-service')).rejects.toThrow(
                'No healthy instances of test-service available'
            );

            expect(logger.warn).toHaveBeenCalled();
        });

        it('should handle discovery errors', async () => {
            const error = new Error('Discovery failed');
            serviceRegistry.consul.health.service.mockRejectedValue(error);

            await expect(serviceRegistry.discoverService('test-service')).rejects.toThrow(
                'Failed to discover service'
            );

            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('deregisterService', () => {
        it('should deregister a service', async () => {
            serviceRegistry.consul.agent.service.deregister.mockResolvedValue(true);

            const serviceId = 'test-service-123';
            const result = await serviceRegistry.deregisterService(serviceId);

            expect(serviceRegistry.consul.agent.service.deregister).toHaveBeenCalledWith(serviceId);
            expect(result).toBe(true);
            expect(logger.info).toHaveBeenCalled();
        });

        it('should handle deregistration errors', async () => {
            const error = new Error('Deregistration failed');
            serviceRegistry.consul.agent.service.deregister.mockRejectedValue(error);

            const serviceId = 'test-service-123';

            await expect(serviceRegistry.deregisterService(serviceId)).rejects.toThrow(
                'Failed to deregister service'
            );

            expect(logger.error).toHaveBeenCalled();
        });
    });
}); 