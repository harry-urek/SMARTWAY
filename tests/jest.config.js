module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    setupFiles: ['<rootDir>/tests/setup.js'],
    globalSetup: '<rootDir>/tests/globalSetup.js',
    globalTeardown: '<rootDir>/tests/globalTeardown.js',
    transform: {
        '^.+\\.js$': 'babel-jest',
        '^.+\\.yml$': 'yaml-jest'
    },
    moduleNameMapper: {
        '\\.yml$': '<rootDir>/tests/mocks/yamlMock.js',
        '^../../src/config$': '<rootDir>/tests/mocks/config.js',
        '^express-gateway$': '<rootDir>/tests/mocks/express-gateway.js'
    }
}; 