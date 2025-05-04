const request = require('supertest');
const { createServer } = require('express-gateway');
const config = require('../../src/config');
const logger = require('../../src/utils/logger');

jest.mock('../../src/utils/logger');

describe('API Gateway Integration Tests', () => {
    let gateway;

    beforeAll(async () => {
        gateway = createServer({
            gatewayConfig: config.gateway
        });
    });

    afterAll(async () => {
        await gateway.close();
    });

    describe('Health Check', () => {
        it('should return 200 for health check endpoint', async () => {
            const response = await request(gateway)
                .get('/health')
                .expect(200);

            expect(response.body).toEqual({ status: 'ok' });
        });
    });

    describe('Metrics', () => {
        it('should expose Prometheus metrics', async () => {
            const response = await request(gateway)
                .get('/metrics')
                .expect(200);

            expect(response.text).toContain('gateway_request_duration_seconds');
            expect(response.text).toContain('gateway_active_requests');
        });
    });

    describe('Request Routing', () => {
        it('should route requests to user service', async () => {
            const response = await request(gateway)
                .get('/api/users')
                .set('Authorization', 'Bearer test-token')
                .expect(200);

            expect(response.body).toBeDefined();
        });

        it('should handle service discovery failures', async () => {
            const response = await request(gateway)
                .get('/api/nonexistent-service')
                .expect(503);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('Rate Limiting', () => {
        it('should enforce rate limits', async () => {
            // Make multiple requests in quick succession
            const requests = Array(110).fill().map(() =>
                request(gateway).get('/api/test')
            );

            const responses = await Promise.all(requests);
            const rateLimitedResponses = responses.filter(res => res.status === 429);

            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });

    describe('Caching', () => {
        it('should cache GET responses', async () => {
            const response1 = await request(gateway)
                .get('/api/cacheable')
                .expect(200);

            const response2 = await request(gateway)
                .get('/api/cacheable')
                .expect(200);

            expect(response2.headers['x-cache']).toBe('HIT');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid requests', async () => {
            const response = await request(gateway)
                .post('/api/invalid')
                .send({ invalid: 'data' })
                .expect(400);

            expect(response.body.error).toBeDefined();
        });

        it('should handle server errors', async () => {
            const response = await request(gateway)
                .get('/api/error')
                .expect(500);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('Security', () => {
        it('should enforce CORS policies', async () => {
            const response = await request(gateway)
                .get('/api/test')
                .set('Origin', 'http://unauthorized.com')
                .expect(403);

            expect(response.body.error).toBeDefined();
        });

        it('should require authentication for protected routes', async () => {
            const response = await request(gateway)
                .get('/api/protected')
                .expect(401);

            expect(response.body.error).toBeDefined();
        });
    });
}); 