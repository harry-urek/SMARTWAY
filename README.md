# Educational Platform API Gateway

This is an API Gateway implementation for the educational platform, built using Express Gateway and Node.js.

## Features

- Request routing and load balancing
- Authentication and rate limiting
- Centralized logging and monitoring
- API versioning support
- Prometheus metrics integration
- Winston logging

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Docker (optional, for containerized deployment)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
NODE_ENV=development
PORT=8080
JWT_SECRET=your-secret-key-here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
PROMETHEUS_PUSHGATEWAY_URL=http://localhost:9091
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

The gateway exposes the following endpoints:

- `/api/*` - Main API endpoint (routes to various microservices)
- `/metrics` - Prometheus metrics endpoint
- `/admin` - Gateway administration interface (port 9876)

## Monitoring

The gateway integrates with Prometheus and Grafana for monitoring. Metrics are available at `/metrics` endpoint.

## Logging

Logs are stored in:
- `error.log` - Error logs
- `combined.log` - All logs

## Deployment

The gateway can be deployed as:
1. Standalone Node.js application
2. Docker container
3. AWS Lambda function

## Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- JWT authentication

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 