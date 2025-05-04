const ServiceRegistry = require('../../../../src/utils/discovery/serviceRegistry');
const logger = require('../../../../src/utils/logger');

jest.mock('../../../../src/utils/logger');
jest.mock('consul', () => jest.fn().mockImplementation(() => global.consulClient));

describe('ServiceRegistry', () => {
    let serviceRegistry;

    beforeEach(() => {
        jest.clearAllMocks();
        serviceRegistry = new ServiceRegistry();
    });

    describe('registerService', () => {
        it('should register a service with Consul', async () => {
            const serviceName = 'test-service';
            const servicePort = 3000;
            const serviceId = `${serviceName}-${servicePort}`;

            global.consulClient.agent.service.register.mockResolvedValue(true);

            await serviceRegistry.registerService(serviceName, servicePort);

            expect(global.consulClient.agent.service.register).toHaveBeenCalledWith({
                id: serviceId,
                name: serviceName,
                port: servicePort,
                check: {
                    http: `http://localhost:${servicePort}/health`,
                    interval: '10s',
                    timeout: '5s'
                }
            });
            expect(logger.info).toHaveBeenCalledWith(`Service ${serviceName} registered with Consul`);
        });

        it('should handle registration errors', async () => {
            const serviceName = 'test-service';
            const servicePort = 3000;
            const error = new Error('Registration failed');

            global.consulClient.agent.service.register.mockRejectedValue(error);

            await expect(serviceRegistry.registerService(serviceName, servicePort))
                .rejects
                .toThrow('Registration failed');
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('discoverService', () => {
        it('should discover a healthy service', async () => {
            const serviceName = 'test-service';
            const mockServices = [{
                Service: {
                    Address: 'localhost',
                    Port: 3000
                },
                Checks: [{ Status: 'passing' }]
            }];

            global.consulClient.health.service.mockResolvedValue(mockServices);

            const result = await serviceRegistry.discoverService(serviceName);

            expect(result).toEqual({
                host: 'localhost',
                port: 3000
            });
        });

        it('should throw error when no healthy services found', async () => {
            const serviceName = 'test-service';
            const mockServices = [{
                Service: {
                    Address: 'localhost',
                    Port: 3000
                },
                Checks: [{ Status: 'critical' }]
            }];

            global.consulClient.health.service.mockResolvedValue(mockServices);

            await expect(serviceRegistry.discoverService(serviceName))
                .rejects
                .toThrow(`No healthy instances of ${serviceName} found`);
        });

        it('should handle discovery errors', async () => {
            const serviceName = 'test-service';
            const error = new Error('Discovery failed');

            global.consulClient.health.service.mockRejectedValue(error);

            await expect(serviceRegistry.discoverService(serviceName))
                .rejects
                .toThrow('Discovery failed');
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('deregisterService', () => {
        it('should deregister a service', async () => {
            const serviceId = 'test-service-3000';

            global.consulClient.agent.service.deregister.mockResolvedValue(true);

            await serviceRegistry.deregisterService(serviceId);

            expect(global.consulClient.agent.service.deregister).toHaveBeenCalledWith(serviceId);
            expect(logger.info).toHaveBeenCalledWith(`Service ${serviceId} deregistered from Consul`);
        });

        it('should handle deregistration errors', async () => {
            const serviceId = 'test-service-3000';
            const error = new Error('Deregistration failed');

            global.consulClient.agent.service.deregister.mockRejectedValue(error);

            await expect(serviceRegistry.deregisterService(serviceId))
                .rejects
                .toThrow('Deregistration failed');
            expect(logger.error).toHaveBeenCalled();
        });
    });
}); 