// Test setup file
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school-management-system-test';
process.env.REDIS_URI = process.env.REDIS_URI || 'redis://127.0.0.1:6379';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.CACHE_PREFIX = 'test:ch';

// Suppress console logs during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
