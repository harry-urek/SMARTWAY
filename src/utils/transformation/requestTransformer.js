const logger = require('../../utils/logger');

class RequestTransformer {
    constructor() {
        this.transformers = new Map();
    }

    registerTransformer(path, transformer) {
        this.transformers.set(path, transformer);
        logger.info(`Registered transformer for path: ${path}`);
    }

    async transformRequest(req, res, next) {
        const path = req.path;
        const transformer = this.transformers.get(path);

        if (!transformer) {
            return next();
        }

        try {
            // Transform request headers
            if (transformer.headers) {
                Object.entries(transformer.headers).forEach(([key, value]) => {
                    req.headers[key] = value;
                });
            }

            // Transform request body
            if (transformer.body && req.body) {
                req.body = await transformer.body(req.body);
            }

            // Transform query parameters
            if (transformer.query && req.query) {
                req.query = await transformer.query(req.query);
            }

            next();
        } catch (error) {
            logger.error(`Error transforming request for path ${path}:`, error);
            next(error);
        }
    }

    async transformResponse(req, res, next) {
        const path = req.path;
        const transformer = this.transformers.get(path);

        if (!transformer || !transformer.response) {
            return next();
        }

        const originalSend = res.send;
        res.send = async function (body) {
            try {
                const transformedBody = await transformer.response(body);
                originalSend.call(this, transformedBody);
            } catch (error) {
                logger.error(`Error transforming response for path ${path}:`, error);
                originalSend.call(this, body);
            }
        };

        next();
    }

    // Example transformer for API versioning
    createVersionTransformer(version) {
        return {
            headers: {
                'X-API-Version': version
            },
            body: async (body) => {
                // Transform body based on version
                return body;
            },
            query: async (query) => {
                // Transform query parameters based on version
                return query;
            },
            response: async (response) => {
                // Transform response based on version
                return response;
            }
        };
    }
}

module.exports = new RequestTransformer(); 