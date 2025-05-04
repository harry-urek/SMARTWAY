class ConsulMock {
    constructor() {
        this.services = new Map();
        this.checks = new Map();
    }

    agent = {
        service: {
            register: async (options) => {
                const { id, name, port, check } = options;
                this.services.set(id, { name, port });
                this.checks.set(id, check);
                return true;
            },
            deregister: async (serviceId) => {
                this.services.delete(serviceId);
                this.checks.delete(serviceId);
                return true;
            }
        }
    };

    health = {
        service: async (serviceName) => {
            const services = Array.from(this.services.entries())
                .filter(([_, service]) => service.name === serviceName)
                .map(([id, service]) => ({
                    Service: {
                        Address: 'localhost',
                        Port: service.port
                    },
                    Checks: [{
                        Status: this.checks.get(id) ? 'passing' : 'critical'
                    }]
                }));
            return services;
        }
    };
}

module.exports = () => new ConsulMock(); 