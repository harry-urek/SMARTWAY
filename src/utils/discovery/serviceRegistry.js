const logger = require('../logger');
const config = require('../../config');
const Consul = require('consul');

class ServiceRegistry {
    constructor() {
        this.consul = new Consul({
            host: config.consul.host,
            port: config.consul.port
        });

        logger.info(`Service registry initialized with Consul at ${config.consul.host}:${config.consul.port}`);
    }

    async registerService(serviceId, serviceName, port, healthCheck) {
        try {
            const registrationOptions = {
                id: serviceId,
                name: serviceName,
                port: port,
                check: healthCheck
            };

            await this.consul.agent.service.register(registrationOptions);
            logger.info(`Service ${serviceName} registered with ID ${serviceId}`);
            return true;
        } catch (error) {
            logger.error(`Error registering service ${serviceName}:`, error);
            throw new Error(`Failed to register service: ${error.message}`);
        }
    }

    async discoverService(serviceName) {
        try {
            const services = await this.consul.health.service(serviceName);

            // Filter for healthy services
            const healthyServices = services.filter(service =>
                service.Checks.every(check => check.Status === 'passing')
            );

            if (healthyServices.length === 0) {
                logger.warn(`No healthy instances found for service ${serviceName}`);
                throw new Error(`No healthy instances of ${serviceName} available`);
            }

            // Use a simple round-robin or random selection from healthy services
            const selectedService = healthyServices[Math.floor(Math.random() * healthyServices.length)];

            return {
                host: selectedService.Service.Address,
                port: selectedService.Service.Port
            };
        } catch (error) {
            logger.error(`Error discovering service ${serviceName}:`, error);
            throw new Error(`Failed to discover service: ${error.message}`);
        }
    }

    async deregisterService(serviceId) {
        try {
            await this.consul.agent.service.deregister(serviceId);
            logger.info(`Service deregistered with ID ${serviceId}`);
            return true;
        } catch (error) {
            logger.error(`Error deregistering service ${serviceId}:`, error);
            throw new Error(`Failed to deregister service: ${error.message}`);
        }
    }
}

module.exports = ServiceRegistry; 