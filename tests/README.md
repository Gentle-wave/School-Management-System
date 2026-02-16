# Testing Guide

This document provides information about the test suite for the School Management System API.

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── managers/           # Business logic tests
│   │   ├── AuthManager.test.js
│   │   └── SchoolManager.test.js
│   └── middleware/         # Middleware tests
│       ├── auth.middleware.test.js
│       └── authorization.middleware.test.js
├── integration/            # Integration tests
│   └── auth.integration.test.js
└── setup.js               # Test configuration
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

## Test Coverage

The test suite aims to cover:
- ✅ Manager business logic
- ✅ Authentication and authorization middleware
- ✅ Validation middleware
- ✅ API endpoints (integration)
- ✅ Error handling

## Writing New Tests

### Unit Test Example

```javascript
const Manager = require('../../../managers/SomeManager');

describe('SomeManager', () => {
  let manager;

  beforeEach(() => {
    manager = new SomeManager({ cache: mockCache });
  });

  it('should do something', async () => {
    // Arrange
    const input = { ... };

    // Act
    const result = await manager.someMethod(input);

    // Assert
    expect(result).toBeDefined();
  });
});
```

### Integration Test Example

```javascript
const request = require('supertest');
const app = require('../../index');

describe('POST /api/endpoint', () => {
  it('should create resource', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ data: 'value' })
      .expect(201);

    expect(response.body.success).toBe(true);
  });
});
```

## Test Environment

Tests run in a separate test environment with:
- Test database (configured via `MONGO_URI`)
- Test Redis instance
- Suppressed console logs (unless `DEBUG` is set)

## Mocking

The test suite uses Jest's mocking capabilities:
- Models are mocked in unit tests
- External dependencies are mocked
- Cache is mocked for manager tests

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach`/`afterEach` for setup/teardown
3. **Descriptive Names**: Test names should clearly describe what they test
4. **AAA Pattern**: Arrange, Act, Assert
5. **Coverage**: Aim for high code coverage
