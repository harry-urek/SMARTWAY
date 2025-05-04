module.exports = {
    port: 8080,
    redis: {
        host: 'localhost',
        port: 6379
    },
    consul: {
        host: 'localhost',
        port: 8500
    },
    gateway: {
        http: {
            port: 8080
        },
        apiEndpoints: {
            api: {
                host: 'localhost',
                paths: ['/api/*']
            }
        },
        serviceEndpoints: {
            userService: {
                url: 'http://localhost:3001'
            },
            courseService: {
                url: 'http://localhost:3002'
            }
        },
        policies: ['jwt', 'cors', 'rate-limit'],
        pipelines: {
            userApi: {
                apiEndpoints: ['api'],
                policies: [
                    { jwt: {} },
                    { cors: {} },
                    { 'rate-limit': {} }
                ]
            }
        }
    }
}; 